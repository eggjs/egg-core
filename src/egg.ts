import assert from 'node:assert';
// import fs from 'node:fs';
import { debuglog } from 'node:util';
import is from 'is-type-of';
import KoaApplication, { type MiddlewareFunc } from '@eggjs/koa';
import { EggConsoleLogger } from 'egg-logger';
import { EggRouter as Router } from '@eggjs/router';
import type { ReadyFunctionArg } from 'get-ready';
import { BaseContextClass } from './utils/base_context_class.js';
import utils from './utils/index.js';
import { Timing } from './utils/timing.js';
import type { Fun } from './utils/index.js';
import { Lifecycle } from './lifecycle.js';
import { EggLoader, EggLoaderMixin } from './loader/egg_loader.js';

const debug = debuglog('@eggjs/core:egg');

const DEPRECATE = Symbol('EggCore#deprecate');
const ROUTER = Symbol('EggCore#router');
const EGG_LOADER = Symbol.for('egg#loader');
const CLOSE_PROMISE = Symbol('EggCore#closePromise');

export interface EggCoreOptions {
  baseDir: string;
  type: 'application' | 'agent';
  plugins?: any;
  serverScope?: string;
  env?: string;
}

export class EggCore extends KoaApplication {
  options: EggCoreOptions;
  timing: Timing;
  console: EggConsoleLogger;
  BaseContextClass: typeof BaseContextClass;
  Controller: typeof BaseContextClass;
  Service: typeof BaseContextClass;
  lifecycle: Lifecycle;
  loader: EggLoaderMixin;

  /**
   * @class
   * @param {Object} options - options
   * @param {String} [options.baseDir=process.cwd()] - the directory of application
   * @param {String} [options.type=application|agent] - whether it's running in app worker or agent worker
   * @param {Object} [options.plugins] - custom plugins
   * @since 1.0.0
   */
  constructor(options: Partial<EggCoreOptions> = {}) {
    options.baseDir = options.baseDir ?? process.cwd();
    options.type = options.type ?? 'application';
    assert(typeof options.baseDir === 'string', 'options.baseDir required, and must be a string');
    // assert(fs.existsSync(options.baseDir), `Directory ${options.baseDir} not exists`);
    // assert(fs.statSync(options.baseDir).isDirectory(), `Directory ${options.baseDir} is not a directory`);
    assert(options.type === 'application' || options.type === 'agent', 'options.type should be application or agent');
    super();

    this.timing = new Timing();
    // cache deprecate object by file
    this[DEPRECATE] = new Map();

    /**
     * @member {Object} EggCore#options
     * @private
     * @since 1.0.0
     */
    this.options = options as EggCoreOptions;

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
     * @augments BaseContextClass
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
     * @augments BaseContextClass
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

    this.lifecycle = new Lifecycle({
      baseDir: options.baseDir,
      app: this,
      logger: this.console,
    });
    this.lifecycle.on('error', err => this.emit('error', err));
    this.lifecycle.on('ready_timeout', id => this.emit('ready_timeout', id));
    this.lifecycle.on('ready_stat', data => this.emit('ready_stat', data));

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
      env: options.env ?? '',
    }) as unknown as EggLoaderMixin;
  }

  /**
   * override koa's app.use, support generator function
   * @since 1.0.0
   */
  use(fn: MiddlewareFunc) {
    assert(is.function(fn), 'app.use() requires a function');
    debug('use %s', (fn as any)._name || fn.name || '-');
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
      // eslint-disable-next-line @typescript-eslint/no-var-requires
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
   * Execute scope after loaded and before app start.
   *
   * Notice:
   * This method is now NOT recommanded and reguarded as a deprecated one,
   * For plugin development, we should use `didLoad` instead.
   * For application development, we should use `willReady` instead.
   *
   * @see https://eggjs.org/en/advanced/loader.html#beforestart
   *
   * @param  {Function|GeneratorFunction|AsyncFunction} scope function will execute before app start
   * @param {string} [name] scope name, default is empty string
   */
  beforeStart(scope: Fun, name?: string) {
    this.lifecycle.registerBeforeStart(scope, name || '');
  }

  /**
   * register an callback function that will be invoked when application is ready.
   * @see https://github.com/node-modules/get-ready
   * @since 1.0.0
   * @example
   * const app = new Application(...);
   * app.ready(err => {
   *   if (err) throw err;
   *   console.log('done');
   * });
   */
  ready(flagOrFunction: ReadyFunctionArg) {
    return this.lifecycle.ready(flagOrFunction);
  }

  /**
   * If a client starts asynchronously, you can register `readyCallback`,
   * then the application will wait for the callback to ready
   *
   * It will log when the callback is not invoked after 10s
   *
   * Recommend to use {@link EggCore#beforeStart}
   * @since 1.0.0
   *
   * @param {String} name - readyCallback task name
   * @param {object} opts -
   *   - {Number} [timeout=10000] - emit `ready_timeout` when it doesn't finish but reach the timeout
   *   - {Boolean} [isWeakDep=false] - whether it's a weak dependency
   * @return {Function} - a callback
   * @example
   * const done = app.readyCallback('mysql');
   * mysql.ready(done);
   */
  readyCallback(name: string, opts) {
    return this.lifecycle.legacyReadyCallback(name, opts);
  }

  /**
   * Register a function that will be called when app close.
   *
   * Notice:
   * This method is now NOT recommanded directly used,
   * Developers SHOULDN'T use app.beforeClose directly now,
   * but in the form of class to implement beforeClose instead.
   *
   * @see https://eggjs.org/en/advanced/loader.html#beforeclose
   *
   * @param {Function} fn - the function that can be generator function or async function.
   */
  beforeClose(fn) {
    this.lifecycle.registerBeforeClose(fn);
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
  async close() {
    if (this[CLOSE_PROMISE]) return this[CLOSE_PROMISE];
    this[CLOSE_PROMISE] = this.lifecycle.close();
    return this[CLOSE_PROMISE];
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
    }, 'use-router');
    return router;
  }

  /**
   * Alias to {@link Router#url}
   * @param {String} name - Router name
   * @param {Object} params - more parameters
   * @return {String} url
   */
  url(name: string, params?: object) {
    return this.router.url(name, params);
  }

  del(...args: any[]) {
    this.router.delete(...args);
    return this;
  }

  get [EGG_LOADER]() {
    return EggLoader;
  }
}

// delegate all router method to application
utils.methods.concat([ 'all', 'resources', 'register', 'redirect' ]).forEach(method => {
  EggCore.prototype[method] = function(...args: any[]) {
    this.router[method](...args);
    return this;
  };
});
