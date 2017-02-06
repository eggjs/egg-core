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


const DEPRECATE = Symbol('EggCore#deprecate');
const CLOSESET = Symbol('EggCore#closeSet');
const ISCLOSE = Symbol('EggCore#isClose');

class EggCore extends KoaApplication {

  /**
   * @constructor
   * @param {Object} options - options
   * @param {String} [options.baseDir=process.cwd()] - the directory of application
   * @param {String} [options.type=application|agent] - wheter it's running in app worker or agent worker
   * @param {Object} [options.plugins] - custom plugins
   * @since 1.0.0
   */
  constructor(options) {
    options = options || {};
    options.baseDir = options.baseDir || process.cwd();
    options.type = options.type || 'application';

    assert(typeof options.baseDir === 'string', 'options.baseDir required, and must be a string');
    assert(fs.existsSync(options.baseDir), `Directory ${options.baseDir} not exists`);
    assert(fs.statSync(options.baseDir).isDirectory(), `Directory ${options.baseDir} is not a directory`);
    assert(options.type === 'application' || options.type === 'agent', 'options.type should be application or agent');

    super();

    /**
     * @member {Object} EggCore#options
     * @since 1.0.0
     */
    this._options = options;

    /**
     * logging for EggCore, avoid using console directly
     * @member {Logger} EggCore#console
     * @since 1.0.0
     */
    this.console = new EggConsoleLogger();

    // register a close set
    this[CLOSESET] = new Set();

    /**
     * BaseContextClass is a base class extended by classes(like service and controller),
     * it will be instantiated every request, and assign ctx and app to this.
     *
     * @member {BaseContextClass} EggCore#BaseContextClass
     * @since 1.0.0
     */
    this.BaseContextClass = BaseContextClass;

    /**
     * @member {EggLoader} EggCore#loader
     * @since 1.0.0
     */
    const Loader = this[Symbol.for('egg#loader')];
    assert(Loader, 'Symbol.for(\'egg#loader\') is required');
    this.loader = new Loader({
      baseDir: options.baseDir,
      app: this,
      plugins: options.plugins,
      logger: this.console,
    });

    this._initReady();
  }

  /**
   * alias to options.type
   * @member {String}
   * @since 1.0.0
   */
  get type() {
    return this._options.type;
  }

  /**
   * alias to options.baseDir
   * @member {String}
   * @since 1.0.0
   */
  get baseDir() {
    return this._options.baseDir;
  }

  /**
   * @member {Function}
   * @see https://npmjs.com/package/depd
   * @since 1.0.0
   */
  get deprecate() {
    if (!this[DEPRECATE]) {
      // require depd when get, `process.env.NO_DEPRECATION = '*'` should be use when run test everytime
      this[DEPRECATE] = require('depd')('egg');
    }
    return this[DEPRECATE];
  }

  /**
   * name in package.json
   * @member {String}
   * @since 1.0.0
   */
  get name() {
    return this.loader.pkg.name;
  }

  /**
   * alias to {EggCore#loader}
   * @member {Object}
   * @since 1.0.0
   */
  get plugins() {
    return this.loader.plugins;
  }

  /**
   * alias to {EggCore#loader}
   * @member {Config}
   * @since 1.0.0
   */
  get config() {
    return this.loader.config;
  }

  /**
   * excute scope after loaded and before app start
   *
   * @param  {Function|GeneratorFunction|AsyncFunction} scope function will excute before app start
   */
  beforeStart(scope) {
    if (!is.function(scope)) {
      throw new Error('beforeStart only support function');
    }

    // get filename from stack
    const name = getCalleeFromStack();
    const done = this.readyCallback(name);

    // ensure scope excutes after load completed
    process.nextTick(() => {
      co(function* () {
        yield utils.callFn(scope);
      }).then(() => done(), done);
    });
  }

  /**
   * close all listeners
   * @member {Function}
   * @return {Promise} promise
   * @since 1.0.0
   */
  close() {
    return co(function* () {
      if (this[ISCLOSE] === true) return;

      // close in reverse order: first created, last closed
      const closeFns = Array.from(this[CLOSESET]);
      for (let i = closeFns.length - 1; i >= 0; i--) {
        yield utils.callFn(closeFns[i]);
      }

      this.emit('close');
      this.removeAllListeners();
      this[ISCLOSE] = true;
    }.bind(this));
  }

  /**
   * register a function that will be called when app close
   * @param {Function} fn - the function that can be generator function or async function
   * @return {Boolean} status - whether registered or not
   */
  beforeClose(fn) {
    assert(is.function(fn), 'argument should be function');
    this[CLOSESET].add(fn);
    return true;
  }

  /**
   * return base controller
   * @member {Controller}
   */
  get Controller() {
    return this.BaseContextClass;
  }

  /**
   * return base service
   * @member {Service}
   */
  get Service() {
    return this.BaseContextClass;
  }

  /**
   * @member {Function}
   * @private
   */
  _initReady() {
    /**
     * register an callback function that will be invoked when application is ready.
     * @member {Function} EggCore#ready
     * @since 1.0.0
     */

    /**
     * If a client starts asynchronously, you can register `readyCallback`,
     * then the application will wait for the callback to ready
     *
     * It will log when the callback is not invoked after 10s
     * @member {Function} EggCore#readyCallback
     * @since 1.0.0
     * @example
     * ```js
     * const done = app.readyCallback('mysql');
     * mysql.ready(done);
     * ```
     */
    require('ready-callback')({ timeout: 10000 }).mixin(this);

    this.on('ready_stat', data => {
      this.console.info('[egg:core:ready_stat] end ready task %s, remain %j', data.id, data.remain);
    }).on('ready_timeout', id => {
      this.console.warn('[egg:core:ready_timeout] 10 seconds later %s was still unable to finish.', id);
    });

    this.ready(() => debug('egg emit ready, application started'));
  }
}

module.exports = EggCore;

function getCalleeFromStack() {
  const _ = new Error();
  const line = _.stack.split('\n')[3] || '';
  const parsed = line.match(/\((.*?)\)/);
  return parsed && parsed[1];
}
