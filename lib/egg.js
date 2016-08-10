'use strict';

const assert = require('assert');
const fs = require('fs');
const KoaApplication = require('koa');
const EggConsoleLogger = require('egg-logger').EggConsoleLogger;

const DEPRECATE = Symbol('EggCore#deprecate');

class EggCore extends KoaApplication {

  /**
   * @constructor
   * @param {Object} options - 创建应用配置
   *  - {String} [process.cwd()] baseDir - app root dir, default is `process.cwd()`
   *  - {String} [application|agent] type
   *  - {Object} plugins - 自定义插件配置，一般只用于单元测试
   */
  constructor(options) {
    options = options || {};
    options.baseDir = options.baseDir || process.cwd();
    options.type = options.type || 'application';

    // 确保 baseDir 存在，是字符串，并且所在目录存在
    assert(typeof options.baseDir === 'string', 'options.baseDir required, and must be a string');
    assert(fs.existsSync(options.baseDir), `Directory ${options.baseDir} not exists`);
    assert(fs.statSync(options.baseDir).isDirectory(), `Directory ${options.baseDir} is not a directory`);
    assert(options.type === 'application' || options.type === 'agent', 'options.type should be application or agent');

    super();

    /**
     * {@link EggCore} 初始化传入的参数
     * @member {Object} EggCore#options
     */
    this._options = options;

    /**
     * console 的替代品，但可由 egg 进行控制
     * @member {Logger} EggCore#console
     */
    this.console = new EggConsoleLogger();

    /**
     * 获取 app 的 Loader
     * @member {AppWorkerLoader} EggCore#loader
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

  get type() {
    return this._options.type;
  }

  /**
   * 应用所在的代码根目录
   * @member {String}
   * @since 1.0.0
   */
  get baseDir() {
    return this._options.baseDir;
  }

  /**
   * 统一的 depd API
   * @member {Function}
   * @see https://npmjs.com/package/depd
   * @since 1.0.0
   */
  get deprecate() {
    if (!this[DEPRECATE]) {
      // 延迟加载，这样允许单元测试通过 process.env.NO_DEPRECATION = '*' 设置不输出
      this[DEPRECATE] = require('depd')('egg');
    }
    return this[DEPRECATE];
  }

  /**
   * 当前应用名, 读取自 `package.json` 的 name 字段。
   * @member {String}
   * @since 1.0.0
   */
  get name() {
    return this.loader.pkg.name;
  }

  /**
   * 获取配置，从 `config/config.${env}.js` 读取
   * @member {Object}
   * @since 1.0.0
   */
  get plugins() {
    return this.loader.plugins;
  }

  /**
   * 获取配置，从 `config/config.${env}.js` 读取
   * @member {Config}
   * @since 1.0.0
   */
  get config() {
    return this.loader.config;
  }

  /**
   * close all listeners
   */
  close() {
    this.emit('close');
    this.removeAllListeners();
  }

  /**
   * 初始化 ready
   * @private
   */
  _initReady() {
    /**
     * 注册 ready 方法，当启动完成后触发此方法
     * @member {Function} EggCore#ready
     * @since 1.0.0
     */

    /**
     * 异步启动接口，查看 https://github.com/koajs/koa-ready
     * 当所有注册的任务完成后才会触发 app.ready，启动才正式完成
     *
     * @member {Function} EggCore#readyCallback
     * @since 1.0.0
     * @example
     * ```js
     * const done = app.readyCallback('configclient');
     * configclient.ready(done);
     * ```
     */
    // 默认 10s 没有 ready 就输出日志提示
    require('ready-callback')({ timeout: 10000 }).mixin(this);

    this.on('ready_stat', data => {
      this.console.info('[egg:core:ready_stat] end ready task %s, remain %j', data.id, data.remain);
    }).on('ready_timeout', id => {
      this.console.warn('[egg:core:ready_timeout] 10 seconds later %s was still unable to finish.', id);
    });
  }

}

module.exports = EggCore;
