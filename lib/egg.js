'use strict';

const assert = require('assert');
const fs = require('fs');
const KoaApplication = require('koa');
const EggConsoleLogger = require('egg-logger').EggConsoleLogger;

const DEPRECATE = Symbol('EggCore#deprecate');

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
    // 跟 jsdoc 不符, 如果暴露给外部的, 那是不是直接挂在 this.options 就好了?
    this._options = options;

    /**
     * logging for EggCore, avoid using console directly
     * @member {Logger} EggCore#console
     * @since 1.0.0
     */
    this.console = new EggConsoleLogger();

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
   * close all listeners
   * @member {Function}
   * @since 1.0.0
   */
  close() {
    this.emit('close');
    this.removeAllListeners();
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
  }

}

module.exports = EggCore;
