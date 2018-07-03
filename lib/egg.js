'use strict';

const assert = require('assert');
const fs = require('fs');
const KoaApplication = require('koa');
const EggConsoleLogger = require('egg-logger').EggConsoleLogger;
const debug = require('debug')('egg-core');
const is = require('is-type-of');
const co = require('co');
const BaseContextClass = require('./utils/base_context_class');
const BootClass = require('./utils/boot_class');
const utils = require('./utils');
const Router = require('./utils/router');
const Timing = require('./utils/timing');
const { Ready } = require('ready-callback');

const DEPRECATE = Symbol('EggCore#deprecate');
const CLOSESET = Symbol('EggCore#closeSet');
const ISCLOSE = Symbol('EggCore#isClose');
const CLOSE_PROMISE = Symbol('EggCore#closePromise');
const ROUTER = Symbol('EggCore#router');
const EGG_LOADER = Symbol.for('egg#loader');
const INIT_READY = Symbol('EggCore#initReady');
const INIT_BOOT_READY = Symbol('EggCore#initBootReady');
const READY_TIMEOUT = Symbol('EggCore#readyTimeout');
const DELEGATE_READY_EVENT = Symbol('EggCore#delegateReadyEvent');
const BOOTS = Symbol.for('EggCore#boots');

const TRIGGER_CONFIG_DID_LOAD = Symbol.for('EggCore#triggerConfigDidLoad');
const TRIGGER_DID_READY = Symbol.for('EggCore#triggerDidReady');
const TRIGGER_SERVER_DID_READY = Symbol.for('EggCore#triggerServerDidReady');
const START_BOOT = Symbol.for('EggCore#startBoot');

const LOAD_READY = Symbol('EggCore#loadReady');
const BOOT_READY = Symbol('EggCore#bootReady');
const READY_CALLBACKS = Symbol('EggCore#readyCallbacks');

const REGISTER_DID_LOAD = Symbol('EggCore#registerDidLoad');
const REGISTER_WILL_READY = Symbol('EggCore#registerWillReady');
const REGISTER_BEFORE_CLOSE = Symbol('EggCore#reigsterBeforeClose');


class EggCore extends KoaApplication {

  /**
   * @constructor
   * @param {Object} options - options
   * @param {String} [options.baseDir=process.cwd()] - the directory of application
   * @param {String} [options.type=application|agent] - whether it's running in app worker or agent worker
   * @param {Object} [options.plugins] - custom plugins
   * @since 1.0.0
   */
  constructor(options = {}) {
    options.baseDir = options.baseDir || process.cwd();
    options.type = options.type || 'application';

    assert(typeof options.baseDir === 'string', 'options.baseDir required, and must be a string');
    assert(fs.existsSync(options.baseDir), `Directory ${options.baseDir} not exists`);
    assert(fs.statSync(options.baseDir).isDirectory(), `Directory ${options.baseDir} is not a directory`);
    assert(options.type === 'application' || options.type === 'agent', 'options.type should be application or agent');

    super();

    this.timing = new Timing();

    // register a close set
    this[CLOSESET] = new Set();
    // cache deprecate object by file
    this[DEPRECATE] = new Map();

    this[INIT_READY]();

    this.timing.start('Application Start');
    this.ready(() => this.timing.end('Application Start'));

    /**
     * @member {Object} EggCore#options
     * @private
     * @since 1.0.0
     */
    this._options = this.options = options;
    this.deprecate.property(this, '_options', 'app._options is deprecated, use app.options instead');

    /**
     * logging for EggCore, avoid using console directly
     * @member {Logger} EggCore#console
     * @private
     * @since 1.0.0
     */
    this.console = new EggConsoleLogger();

    /**
     * @member {BaseContextClass} EggCore#BaseContextClass
     * @since 1.0.0
     */
    this.BaseContextClass = BaseContextClass;

    /**
     * Base controller to be extended by controller in `app.controller`
     * @class Controller
     * @extends BaseContextClass
     * @example
     * class UserController extends app.Controller {}
     */
    const Controller = this.BaseContextClass;

    /**
     * Retrieve base controller
     * @member {Controller} EggCore#Controller
     * @since 1.0.0
     */
    this.Controller = Controller;

    /**
     * Base service to be extended by services in `app.service`
     * @class Service
     * @extends BaseContextClass
     * @example
     * class UserService extends app.Service {}
     */
    const Service = this.BaseContextClass;

    /**
     * Retrieve base service
     * @member {Service} EggCore#Service
     * @since 1.0.0
     */
    this.Service = Service;

    /**
     * @member {BootClass} EggCore#BootClass
     */
    this.BootClass = BootClass;

    /**
     * Base boot to be extended by boot in `app.boot`
     * @class Boot
     * @extends BootClass
     * @example Boot extends app.Boot {}
     */
    const Boot = this.BootClass;

    /**
     * Retrieve base boot
     * @member {Boot} EggCore#Boot
     */
    this.Boot = Boot;
    this[BOOTS] = [];

    /**
     * The loader instance, the default class is {@link EggLoader}.
     * If you want define
     * @member {EggLoader} EggCore#loader
     * @since 1.0.0
     */
    const Loader = this[EGG_LOADER];
    assert(Loader, 'Symbol.for(\'egg#loader\') is required');
    this.loader = new Loader({
      baseDir: options.baseDir,
      app: this,
      plugins: options.plugins,
      logger: this.console,
      serverScope: options.serverScope,
    });
  }

  /**
   * override koa's app.use, support generator function
   * @param {Function} fn - middleware
   * @return {Application} app
   * @since 1.0.0
   */
  use(fn) {
    assert(is.function(fn), 'app.use() requires a function');
    debug('use %s', fn._name || fn.name || '-');
    this.middleware.push(utils.middleware(fn));
    return this;
  }

  /**
   * Whether `application` or `agent`
   * @member {String}
   * @since 1.0.0
   */
  get type() {
    return this.options.type;
  }

  /**
   * The current directory of application
   * @member {String}
   * @see {@link AppInfo#baseDir}
   * @since 1.0.0
   */
  get baseDir() {
    return this.options.baseDir;
  }

  /**
   * Alias to {@link https://npmjs.com/package/depd}
   * @member {Function}
   * @since 1.0.0
   */
  get deprecate() {
    const caller = utils.getCalleeFromStack();
    if (!this[DEPRECATE].has(caller)) {
      const deprecate = require('depd')('egg');
      // dynamic set _file to caller
      deprecate._file = caller;
      this[DEPRECATE].set(caller, deprecate);
    }
    return this[DEPRECATE].get(caller);
  }

  /**
   * The name of application
   * @member {String}
   * @see {@link AppInfo#name}
   * @since 1.0.0
   */
  get name() {
    return this.loader ? this.loader.pkg.name : '';
  }

  /**
   * Retrieve enabled plugins
   * @member {Object}
   * @since 1.0.0
   */
  get plugins() {
    return this.loader ? this.loader.plugins : {};
  }

  /**
   * The configuration of application
   * @member {Config}
   * @since 1.0.0
   */
  get config() {
    return this.loader ? this.loader.config : {};
  }

  /**
   * Execute scope after loaded and before app start
   *
   * @param  {Function|GeneratorFunction|AsyncFunction} scope function will execute before app start
   */
  beforeStart(scope) {
    this.registerReadyCallback(scope, this[LOAD_READY], 'Before Start');
  }

  registerReadyCallback(scope, ready, timingKeyPrefix) {
    if (!is.function(scope)) {
      throw new Error('boot only support function');
    }

    // get filename from stack
    const name = utils.getCalleeFromStack(true, 3);
    const timingkey = `${timingKeyPrefix} in ` + utils.getResolvedFilename(name, this.options.baseDir);

    this.timing.start(timingkey);

    const done = ready.readyCallback(name);

    // ensure scope executes after load completed
    process.nextTick(() => {
      utils.callFn(scope).then(() => {
        done();
        this.timing.end(timingkey);
      }, err => {
        done(err);
        this.timing.end(timingkey);
      });
    });
  }

  /**
   * Close all, it will close
   * - callbacks registered by beforeClose
   * - emit `close` event
   * - remove add listeners
   *
   * If error is thrown when it's closing, the promise will reject.
   * It will also reject after following call.
   * @return {Promise} promise
   * @since 1.0.0
   */
  close() {
    if (this[CLOSE_PROMISE]) return this[CLOSE_PROMISE];

    const closeFunction = async () => {
      // close in reverse order: first created, last closed
      const closeFns = Array.from(this[CLOSESET]);
      for (const fn of closeFns.reverse()) {
        await utils.callFn(fn);
        this[CLOSESET].delete(fn);
      }
      // Be called after other close callbacks
      this.emit('close');
      this.removeAllListeners();
      this[ISCLOSE] = true;
    };
    this[CLOSE_PROMISE] = closeFunction();
    return this[CLOSE_PROMISE];
  }

  /**
   * Register a function that will be called when app close
   * @param {Function} fn - the function that can be generator function or async function
   */
  beforeClose(fn) {
    assert(is.function(fn), 'argument should be function');
    this[CLOSESET].add(fn);
  }

  /**
   * @member {Function}
   * @private
   */
  [INIT_READY]() {
    /**
     * register an callback function that will be invoked when application is ready.
     * @method {Function} EggCore#ready
     * @see https://github.com/node-modules/ready
     * @since 1.0.0
     * @example
     * const app = new Application(...);
     * app.ready(err => {
     *   if (err) throw err;
     *   console.log('done');
     * });
     */

    // get app timeout from env or use default timeout 10 second
    const eggReadyTimeoutEnv = Number.parseInt(process.env.EGG_READY_TIMEOUT_ENV || 10000);
    assert(Number.isInteger(eggReadyTimeoutEnv), `process.env.EGG_READY_TIMEOUT_ENV ${process.env.EGG_READY_TIMEOUT_ENV} should be able to parseInt.`);
    this[READY_TIMEOUT] = eggReadyTimeoutEnv;

    /**
     * If a client starts asynchronously, you can register `readyCallback`,
     * then the application will wait for the callback to ready
     *
     * It will log when the callback is not invoked after 10s
     *
     * Recommend to use {@link EggCore#beforeStart}
     * @method {Function} EggCore#readyCallback
     * @since 1.0.0
     * @example
     * const done = app.readyCallback('mysql');
     * mysql.ready(done);
     */
    this[LOAD_READY] = new Ready({ timeout: this[READY_TIMEOUT] });
    // init after didLoad
    this[BOOT_READY] = null;

    this.readyCallback = this[LOAD_READY].readyCallback.bind(this[LOAD_READY]);
    this[READY_CALLBACKS] = [];
    this[DELEGATE_READY_EVENT](this[LOAD_READY]);

    this.on('ready_stat', data => {
      this.console.info('[egg:core:ready_stat] end ready task %s, remain %j', data.id, data.remain);
    }).on('ready_timeout', id => {
      this.console.warn('[egg:core:ready_timeout] %s seconds later %s was still unable to finish.', eggReadyTimeoutEnv / 1000, id);
    });
  }

  [INIT_BOOT_READY]() {
    if (this[BOOT_READY]) return;
    this[BOOT_READY] = new Ready({ timeout: this[READY_TIMEOUT] });
    this[DELEGATE_READY_EVENT](this[BOOT_READY]);
    this[BOOT_READY].ready(err => {
      debug('willReady done');
      this[TRIGGER_DID_READY](err);
    });
  }

  ready(flagOrFunction) {
    if (flagOrFunction === undefined || is.function(flagOrFunction)) {
      // boot ready have not init
      if (!this[BOOT_READY]) {
        // push function to callback cache
        if (is.function(flagOrFunction)) {
          this[READY_CALLBACKS].push(flagOrFunction);
        } else {
          // return a promise and create function to callback cache
          return new Promise((resolve, reject) => {
            const fn = err => (err ? reject(err) : resolve());
            this[READY_CALLBACKS].push(fn);
          });
        }
      } else {
        // use boot ready
        return this[BOOT_READY].ready(flagOrFunction);
      }
    } else {
      // boot ready have not init
      this[INIT_BOOT_READY]();
      return this[BOOT_READY].ready(flagOrFunction);
    }
  }

  [DELEGATE_READY_EVENT](ready) {
    ready.once('error', err => this.ready(err));
    ready.on('ready_timeout', this.emit.bind(this, 'ready_timeout'));
    ready.on('ready_stat', this.emit.bind(this, 'ready_stat'));
    ready.on('error', this.emit.bind(this, 'error'));
  }

  /**
   * get router
   * @member {Router} EggCore#router
   * @since 1.0.0
   */
  get router() {
    if (this[ROUTER]) {
      return this[ROUTER];
    }
    const router = this[ROUTER] = new Router({ sensitive: true }, this);
    // register router middleware
    this.beforeStart(() => {
      this.use(router.middleware());
    });
    return router;
  }

  /**
   * Alias to {@link Router#url}
   * @param {String} name - Router name
   * @param {Object} params - more parameters
   * @return {String} url
   */
  url(name, params) {
    return this.router.url(name, params);
  }

  del(...args) {
    this.router.delete(...args);
    return this;
  }

  get [EGG_LOADER]() {
    return require('./loader/egg_loader');
  }

  /**
   * Convert a generator function to a promisable one.
   *
   * Notice: for other kinds of functions, it directly returns you what it is.
   *
   * @param  {Function} fn The inputted function.
   * @return {AsyncFunction} An async promise-based function.
   * @example
   * ```javascript
   *  const fn = function* (arg) {
        return arg;
      };
      const wrapped = app.toAsyncFunction(fn);
      wrapped(true).then((value) => console.log(value));
   * ```
   */
  toAsyncFunction(fn) {
    if (!is.generatorFunction(fn)) return fn;
    fn = co.wrap(fn);
    return async function(...args) {
      return fn.apply(this, args);
    };
  }

  /**
   * Convert an object with generator functions to a Promisable one.
   * @param  {Mixed} obj The inputted object.
   * @return {Promise} A Promisable result.
   * @example
   * ```javascript
   *  const fn = function* (arg) {
        return arg;
      };
      const arr = [ fn(1), fn(2) ];
      const promise = app.toPromise(arr);
      promise.then(res => console.log(res));
   * ```
   */
  toPromise(obj) {
    return co(function* () {
      return yield obj;
    });
  }

  [TRIGGER_CONFIG_DID_LOAD]() {
    for (const boot of this[BOOTS]) {
      if (boot.configDidLoad) {
        boot.configDidLoad();
      }
    }
  }

  [TRIGGER_DID_READY](err) {
    debug('trigger didReady');
    const didReadys = this[BOOTS]
      .filter(t => t.didReady)
      .map(t => t.didReady.bind(t));
    const readyCbs = [
      ...this[READY_CALLBACKS],
      ...didReadys,
    ];
    (async () => {
      for (const cb of readyCbs) {
        try {
          await utils.callFn(cb, [ err ]);
        } catch (e) {
          this.emit('error', e);
        }
      }
      debug('trigger didReady done');
    })();
  }

  [TRIGGER_SERVER_DID_READY]() {
    (async () => {
      for (const boot of this[BOOTS]) {
        try {
          await utils.callFn(boot.serverDidReady, null, boot);
        } catch (e) {
          this.emit('error', e);
        }
      }
    })();
  }

  [START_BOOT]() {
    this[REGISTER_DID_LOAD]();
    this[REGISTER_BEFORE_CLOSE]();
  }

  [REGISTER_DID_LOAD]() {
    debug('register didLoad');
    for (const boot of this[BOOTS]) {
      if (boot.didLoad) {
        this.registerReadyCallback(boot.didLoad, this[LOAD_READY], 'Did Load');
      }
    }
    this[LOAD_READY].ready(error => {
      debug('didLoad done');
      if (error) {
        this.ready(error);
      } else {
        this[REGISTER_WILL_READY]();
      }
    });
  }

  [REGISTER_WILL_READY]() {
    debug('register willReady');
    this[INIT_BOOT_READY]();
    for (const boot of this[BOOTS]) {
      if (boot.willReady) {
        this.registerReadyCallback(boot.willReady, this[BOOT_READY], 'Will Ready');
      }
    }
  }

  [REGISTER_BEFORE_CLOSE]() {
    for (const boot of this[BOOTS]) {
      if (boot.beforeClose) {
        this.beforeClose(boot.beforeClose);
      }
    }
  }
}

// delegate all router method to application
utils.methods.concat([ 'all', 'resources', 'register', 'redirect' ]).forEach(method => {
  EggCore.prototype[method] = function(...args) {
    this.router[method](...args);
    return this;
  };
});

module.exports = EggCore;
