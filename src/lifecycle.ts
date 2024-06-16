import assert from 'node:assert';
import { EventEmitter } from 'node:events';
import { debuglog } from 'node:util';
import is, { isClass } from 'is-type-of';
import ReadyObject from 'get-ready';
import type { ReadyFunctionArg } from 'get-ready';
import { Ready } from 'ready-callback';
import { EggConsoleLogger } from 'egg-logger';
import utils from './utils/index.js';
import type { Fun } from './utils/index.js';
import type { EggCore } from './egg.js';

const debug = debuglog('@eggjs/core:lifecycle');

export interface ILifecycleBoot {
  // loader auto set 'fullPath' property on boot class
  fullPath?: string;
  /**
   * Ready to call configDidLoad,
   * Config, plugin files are referred,
   * this is the last chance to modify the config.
   */
  configWillLoad?(): void;

  /**
   * Config, plugin files have loaded
   */
  configDidLoad?(): void;

  /**
   * All files have loaded, start plugin here
   */
  didLoad?(): Promise<void>;

  /**
   * All plugins have started, can do some thing before app ready
   */
  willReady?(): Promise<void>;

  /**
   * Worker is ready, can do some things,
   * don't need to block the app boot
   */
  didReady?(err?: Error): Promise<void>;

  /**
   * Server is listening
   */
  serverDidReady?(): Promise<void>;

  /**
   * Do some thing before app close
   */
  beforeClose?(): Promise<void>;
}

export type BootImplClass<T = object> = (new(...args: any[]) => T) & ILifecycleBoot;

export interface LifecycleOptions {
  baseDir: string;
  app: EggCore;
  logger: EggConsoleLogger;
}

export class Lifecycle extends EventEmitter {
  #init: boolean;
  #readyObject: ReadyObject;
  #bootHooks: (BootImplClass | ILifecycleBoot)[];
  #boots: ILifecycleBoot[];
  #isClosed: boolean;
  #closeFunctionSet: Set<Fun>;
  loadReady: Ready;
  bootReady: Ready;
  options: LifecycleOptions;
  readyTimeout: number;

  constructor(options: Partial<LifecycleOptions>) {
    super();
    options.logger = options.logger ?? new EggConsoleLogger();
    this.options = options as LifecycleOptions;
    this.#readyObject = new ReadyObject();
    this.#bootHooks = [];
    this.#boots = [];
    this.#closeFunctionSet = new Set();
    this.#isClosed = false;
    this.#init = false;

    this.timing.start('Application Start');
    // get app timeout from env or use default timeout 10 second
    const eggReadyTimeoutEnv = parseInt(process.env.EGG_READY_TIMEOUT_ENV || '10000');
    assert(
      Number.isInteger(eggReadyTimeoutEnv),
      `process.env.EGG_READY_TIMEOUT_ENV ${process.env.EGG_READY_TIMEOUT_ENV} should be able to parseInt.`);
    this.readyTimeout = eggReadyTimeoutEnv;

    this.#initReady();
    this
      .on('ready_stat', data => {
        this.logger.info('[egg:core:ready_stat] end ready task %s, remain %j', data.id, data.remain);
      })
      .on('ready_timeout', id => {
        this.logger.warn('[egg:core:ready_timeout] %s seconds later %s was still unable to finish.', this.readyTimeout / 1000, id);
      });

    this.ready(err => {
      this.triggerDidReady(err);
      debug('app ready');
      this.timing.end('Application Start');
    });
  }

  ready(arg?: ReadyFunctionArg) {
    return this.#readyObject.ready(arg);
  }

  get app() {
    return this.options.app;
  }

  get logger() {
    return this.options.logger;
  }

  get timing() {
    return this.app.timing;
  }

  legacyReadyCallback(name: string, opt?: object) {
    const timingKeyPrefix = 'readyCallback';
    const timing = this.timing;
    const cb = this.loadReady.readyCallback(name, opt);
    const timingKey = `${timingKeyPrefix} in ` + utils.getResolvedFilename(name, this.app.baseDir);
    this.timing.start(timingKey);
    debug('register legacyReadyCallback');
    return function legacyReadyCallback(...args: any[]) {
      timing.end(timingKey);
      debug('end legacyReadyCallback');
      cb(...args);
    };
  }

  addBootHook(bootHootOrBootClass: BootImplClass | ILifecycleBoot) {
    assert(this.#init === false, 'do not add hook when lifecycle has been initialized');
    this.#bootHooks.push(bootHootOrBootClass);
  }

  addFunctionAsBootHook<T = EggCore>(hook: (app: T) => void) {
    assert(this.#init === false, 'do not add hook when lifecycle has been initialized');
    // app.js is exported as a function
    // call this function in configDidLoad
    this.#bootHooks.push(class Boot implements ILifecycleBoot {
      app: T;
      constructor(app: T) {
        this.app = app;
      }
      configDidLoad() {
        hook(this.app);
      }
    });
  }

  /**
   * init boots and trigger config did config
   */
  init() {
    assert(this.#init === false, 'lifecycle have been init');
    this.#init = true;
    this.#boots = this.#bootHooks.map(BootHootOrBootClass => {
      if (isClass(BootHootOrBootClass)) {
        return new BootHootOrBootClass(this.app);
      }
      return BootHootOrBootClass;
    });
  }

  registerBeforeStart(scope: Fun, name: string) {
    debug('add registerBeforeStart, name: %o', name);
    this.#registerReadyCallback({
      scope,
      ready: this.loadReady,
      timingKeyPrefix: 'Before Start',
      scopeFullName: name,
    });
  }

  registerBeforeClose(fn: Fun) {
    assert(is.function(fn), 'argument should be function');
    assert(this.#isClosed === false, 'app has been closed');
    this.#closeFunctionSet.add(fn);
  }

  async close() {
    // close in reverse order: first created, last closed
    const closeFns = Array.from(this.#closeFunctionSet);
    for (const fn of closeFns.reverse()) {
      await utils.callFn(fn);
      this.#closeFunctionSet.delete(fn);
    }
    // Be called after other close callbacks
    this.app.emit('close');
    this.removeAllListeners();
    this.app.removeAllListeners();
    this.#isClosed = true;
  }

  triggerConfigWillLoad() {
    debug('trigger configWillLoad start');
    for (const boot of this.#boots) {
      if (typeof boot.configWillLoad === 'function') {
        boot.configWillLoad();
      }
    }
    debug('trigger configWillLoad end');
    this.triggerConfigDidLoad();
  }

  triggerConfigDidLoad() {
    debug('trigger configDidLoad start');
    for (const boot of this.#boots) {
      if (typeof boot.configDidLoad === 'function') {
        boot.configDidLoad();
      }
      // function boot hook register after configDidLoad trigger
      if (typeof boot.beforeClose === 'function') {
        const beforeClose = boot.beforeClose.bind(boot);
        this.registerBeforeClose(beforeClose);
      }
    }
    debug('trigger configDidLoad end');
    this.triggerDidLoad();
  }

  triggerDidLoad() {
    debug('trigger didLoad start');
    debug('loadReady start');
    this.loadReady.start();
    for (const boot of this.#boots) {
      if (typeof boot.didLoad === 'function') {
        const didLoad = boot.didLoad.bind(boot);
        this.#registerReadyCallback({
          scope: didLoad,
          ready: this.loadReady,
          timingKeyPrefix: 'Did Load',
          scopeFullName: boot.fullPath + ':didLoad',
        });
      }
    }
  }

  triggerWillReady() {
    debug('trigger willReady start');
    debug('bootReady start');
    this.bootReady.start();
    for (const boot of this.#boots) {
      if (typeof boot.willReady === 'function') {
        const willReady = boot.willReady.bind(boot);
        this.#registerReadyCallback({
          scope: willReady,
          ready: this.bootReady,
          timingKeyPrefix: 'Will Ready',
          scopeFullName: boot.fullPath + ':willReady',
        });
      }
    }
  }

  triggerDidReady(err?: Error) {
    debug('trigger didReady start');
    return (async () => {
      for (const boot of this.#boots) {
        if (typeof boot.didReady === 'function') {
          try {
            await boot.didReady(err);
          } catch (e) {
            this.emit('error', e);
          }
        }
      }
      debug('trigger didReady end');
    })();
  }

  triggerServerDidReady() {
    debug('trigger serverDidReady start');
    return (async () => {
      for (const boot of this.#boots) {
        if (typeof boot.serverDidReady !== 'function') {
          continue;
        }
        try {
          await boot.serverDidReady();
        } catch (err) {
          this.emit('error', err);
        }
      }
      debug('trigger serverDidReady end');
    })();
  }

  #initReady() {
    debug('loadReady init');
    this.loadReady = new Ready({ timeout: this.readyTimeout, lazyStart: true });
    this.#delegateReadyEvent(this.loadReady);
    this.loadReady.ready((err?: Error) => {
      debug('loadReady end, err: %o', err);
      debug('trigger didLoad end');
      if (err) {
        this.ready(err);
      } else {
        this.triggerWillReady();
      }
    });

    debug('bootReady init');
    this.bootReady = new Ready({ timeout: this.readyTimeout, lazyStart: true });
    this.#delegateReadyEvent(this.bootReady);
    this.bootReady.ready((err?: Error) => {
      debug('bootReady end, err: %o', err);
      debug('trigger willReady end');
      this.ready(err || true);
    });
  }

  #delegateReadyEvent(ready: Ready) {
    ready.once('error', (err?: Error) => ready.ready(err));
    ready.on('ready_timeout', (id: any) => this.emit('ready_timeout', id));
    ready.on('ready_stat', (data: any) => this.emit('ready_stat', data));
    ready.on('error', (err?: Error) => this.emit('error', err));
  }

  #registerReadyCallback(args: {
    scope: Fun;
    ready: Ready;
    timingKeyPrefix: string;
    scopeFullName?: string;
  }) {
    const { scope, ready, timingKeyPrefix, scopeFullName } = args;
    if (typeof scope !== 'function') {
      throw new Error('boot only support function');
    }

    // get filename from stack if scopeFullName is undefined
    const name = scopeFullName || utils.getCalleeFromStack(true, 4);
    const timingKey = `${timingKeyPrefix} in ` + utils.getResolvedFilename(name, this.app.baseDir);

    this.timing.start(timingKey);

    debug('[registerReadyCallback] start name: %o', name);
    const done = ready.readyCallback(name);

    // ensure scope executes after load completed
    process.nextTick(() => {
      utils.callFn(scope).then(() => {
        debug('[registerReadyCallback] end name: %o', name);
        done();
        this.timing.end(timingKey);
      }, (err: Error) => {
        done(err);
        this.timing.end(timingKey);
      });
    });
  }
}
