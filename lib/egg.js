'use strict';

const assert = require('assert');
const fs = require('fs');
const KoaApplication = require('koa');
const EggConsoleLogger = require('egg-logger').EggConsoleLogger;
const debug = require('debug')('egg-core');
const is = require('is-type-of');
const co = require('co');
const BaseContextClass = require('./utils/base_context_class');
const utils = require('./utils');
const Router = require('./utils/router');


const DEPRECATE = Symbol('EggCore#deprecate');
const CLOSESET = Symbol('EggCore#closeSet');
const ISCLOSE = Symbol('EggCore#isClose');
const CLOSE_PROMISE = Symbol('EggCore#closePromise');
const ROUTER = Symbol('EggCore#router');
const EGG_LOADER = Symbol.for('egg#loader');
const INIT_READY = Symbol('EggCore#initReady');
const EGG_READY_TIMEOUT_ENV = Symbol('EggCore#eggReadyTimeoutEnv');

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

    // get app timeout from env or use default timeout 10 second
    const eggReadyTimeoutEnv = process.env.EGG_READY_TIMEOUT_ENV;
    this[EGG_READY_TIMEOUT_ENV] = Number.parseInt(eggReadyTimeoutEnv || 10000);

    assert(Number.isInteger(this[EGG_READY_TIMEOUT_ENV]), `process.env.EGG_READY_TIMEOUT_ENV ${eggReadyTimeoutEnv} should be able to parseInt.`);

    /**
     * @member {Object} EggCore#_options
     * @private
     * @since 1.0.0
     */
    this._options = options;

    /**
     * logging for EggCore, avoid using console directly
     * @member {Logger} EggCore#console
     * @private
     * @since 1.0.0
     */
    this.console = new EggConsoleLogger();

    // register a close set
    this[CLOSESET] = new Set();
    // cache deprecate object by file
    this[DEPRECATE] = new Map();

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
    });

    this[INIT_READY]();
  }

  /**
   * override koa's app.use, support async function
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
    return this._options.type;
  }

  /**
   * The current directory of application
   * @member {String}
   * @see {@link AppInfo#baseDir}
   * @since 1.0.0
   */
  get baseDir() {
    return this._options.baseDir;
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
    if (!is.function(scope)) {
      throw new Error('beforeStart only support function');
    }

    // get filename from stack
    const name = utils.getCalleeFromStack(true);
    const done = this.readyCallback(name);

    // ensure scope executes after load completed
    process.nextTick(() => {
      co(function* () {
        yield utils.callFn(scope);
      }).then(() => done(), done);
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

    this[CLOSE_PROMISE] = co(function* closeFunction() {
      // close in reverse order: first created, last closed
      const closeFns = Array.from(this[CLOSESET]);
      for (const fn of closeFns.reverse()) {
        yield utils.callFn(fn);
        this[CLOSESET].delete(fn);
      }

      // Be called after other close callbacks
      this.emit('close');
      this.removeAllListeners();
      this[ISCLOSE] = true;
    }.bind(this));
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
    require('ready-callback')({ timeout: this[EGG_READY_TIMEOUT_ENV] }).mixin(this);

    this.on('ready_stat', data => {
      this.console.info('[egg:core:ready_stat] end ready task %s, remain %j', data.id, data.remain);
    }).on('ready_timeout', id => {
      this.console.warn('[egg:core:ready_timeout] %s seconds later %s was still unable to finish.', this[EGG_READY_TIMEOUT_ENV] / 1000, id);
    });

    this.ready(() => debug('egg emit ready, application started'));
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
    this.use(router.middleware());
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
}

// delegate all router method to application
utils.methods.concat([ 'all', 'resources', 'register', 'redirect' ]).forEach(method => {
  EggCore.prototype[method] = function(...args) {
    this.router[method](...args);
    return this;
  };
});

module.exports = EggCore;
