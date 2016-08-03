'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const isFunction = require('is-type-of').function;
const interopRequire = require('interop-require');
const debug = require('debug')('egg-loader');
const Loader = require('./loader');
const Emitter = require('events').EventEmitter;

class EggLoader {

  /**
   * @constructor
   * @param {Object} options
   * - {String} [baseDir] - 应用根目录
   * - {Object} [app] - app 实例，如果是 Agent Worker 则传入 agent 实例，可为空
   * - {Object} [plugins] - 自定义插件配置，测试用
   * - {Logger} [logger] - logger 实例，默认是 console
   */
  constructor(options) {
    options = options || {};
    assert(fs.existsSync(options.baseDir), `${options.baseDir} not exists`);

    this.options = options;
    this.options.logger = this.options.logger || console;
    this.app = this.options.app || {}; // master 没有 app

    /**
     * 读取 package.json
     * @member {Object} EggLoader#pkg
     */
    this.pkg = require(path.join(this.options.baseDir, 'package.json'));

    /**
     * @member {Array} EggLoader#eggPaths
     * @see EggLoader#getEggPaths
     */
    this.eggPaths = this.getEggPaths();
    debug('Loaded eggPaths %j', this.eggPaths);

    /**
     * @member {String} EggLoader#serverEnv
     * @see EggLoader#getServerEnv
     */
    this.serverEnv = this.getServerEnv();
    debug('Loaded serverEnv %j', this.serverEnv);
  }

  /**
   * Get environment of Egg, **it's not NODE_ENV**
   *
   * 1. from `$baseDir/config/serverEnv`
   * 2. from EGG_SERVER_ENV
   * 3. from NODE_ENV
   *
   * serverEnv | description
   * ---       | ---
   * default   | default environment
   * test      | system integration testing
   * prod      | production
   * local     | local on your own computer
   * unittest  | unit test
   *
   * @return {String} serverEnv
   */
  getServerEnv() {
    let serverEnv;

    const envPath = path.join(this.options.baseDir, 'config/serverEnv');
    if (fs.existsSync(envPath)) {
      serverEnv = fs.readFileSync(envPath, 'utf8').trim();
    }

    if (!serverEnv) {
      serverEnv = process.env.EGG_SERVER_ENV;
    }

    if (!serverEnv) {
      if (process.env.NODE_ENV === 'test') {
        serverEnv = 'unittest';
      } else if (process.env.NODE_ENV === 'production') {
        serverEnv = 'default';
      } else {
        serverEnv = 'local';
      }
    }

    return serverEnv;
  }

  /**
   * Get all framework directories.
   *
   * You can extend Application of egg, the extrypoint is options.app,
   *
   * loader will find all directories from the prototype of Application,
   * you should define `Symbol.for('egg#eggPath')` property.
   *
   * ```
   * // lib/xx.js
   * const egg = require('egg');
   * class XxApplication extends egg.Application {
   *   constructor(options) {
   *     super(options);
   *   }
   *
   *   get [Symbol.for('egg#eggPath')]() {
   *     return path.join(__dirname, '..');
   *   }
   * }
   * ```
   *
   * @return {Array} framework directories
   */
  getEggPaths() {
    const eggPaths = [];

    let proto = this.app;
    while (proto) {
      proto = Object.getPrototypeOf(proto);
      if (proto) {
        if (isKoa(proto)) {
          break;
        }
        const eggPath = proto[Symbol.for('egg#eggPath')];
        assert(eggPath, 'Symbol.for(\'egg#eggPath\') is required on Application');
        // 使用 fs.realpathSync 来找到最终路径
        const realpath = fs.realpathSync(eggPath);
        if (eggPaths.indexOf(realpath) === -1) {
          eggPaths.unshift(realpath);
        }
      }
    }

    return eggPaths;
  }

  /**
   * 加载自定义的 app.js，**在 app.js 可做任何操作，但建议尽量减少此操作，做该做的事**。
   *
   * 可加载路径查看 {@link EggLoader#loadDirs}
   * @example
   * ```js
   * module.exports = function(app) {
   *   // 自定义
   * }
   * ```
   */
  loadCustomApp() {
    this.loadDirs()
      .forEach(dir => this.loadFile(path.join(dir, 'app.js')));
  }

  /**
   * 同 {@link EggLoader#loadCustomApp}，但加载自定义的 agent.js
   *
   * 可加载路径查看 {@link EggLoader#loadDirs}
   * @example
   * ```js
   * module.exports = function(agent) {
   *   // 自定义
   * }
   * ```
   */
  loadCustomAgent() {
    this.loadDirs()
      .forEach(dir => this.loadFile(path.join(dir, 'agent.js')));
  }

  /**
   * 加载 app/controller 目录下的文件
   *
   * @param {Object} opt - loading 参数
   */
  loadController(opt) {
    const app = this.app;
    opt = Object.assign({ lowercaseFirst: true }, opt);
    const controllerBase = path.join(this.options.baseDir, 'app/controller');

    this.loadToApp(controllerBase, 'controller', opt);
    app.controllers = app.controller;
    app.coreLogger.info('[egg:loader] Controller loaded: %s', controllerBase);
  }

  /**
   * 加载指定文件，如果文件返回是函数则返回函数的调用结果，否则直接返回。
   *
   * @param {String} filepath - 加载的文件路径
   * @param {Object} inject - 调用函数时的第一个参数，默认为 app
   * @return {Object} - 返回加载文件的结果
   * @example
   * ```js
   * app.loader.loadFile(path.join(app.options.baseDir, 'config/router.js'));
   * ```
   */
  loadFile(filepath) {
    if (!fs.existsSync(filepath)) {
      return null;
    }

    let ret;
    try {
      ret = interopRequire(filepath);
    } catch (err) {
      err.message = `[egg-loader] load file ${filepath} error: ${err.message}`;
      throw err;
    }
    // 可支持传入多个参数
    // function(arg1, args, ...) {}
    let inject = Array.prototype.slice.call(arguments, 1);
    if (inject.length === 0) inject = [ this.app ];
    return isFunction(ret) ? ret.apply(null, inject) : ret;
  }

  /**
   * 返回 egg 需要加载的目录
   *
   * 1. 核心框架目录，目录为框架根目录下的 lib/core 目录，框架根目录来自 {@link EggLoader#eggPaths}
   * 2. 已开启插件的根目录
   * 3. 应用根目录
   *
   * @return {Array} 返回所有目录
   */
  loadDirs() {
    // 做一层缓存
    if (this.dirs) {
      return this.dirs;
    }

    const dirs = this.dirs = [];

    // 插件目录，master 没有 plugin
    if (this.orderPlugins) {
      for (const plugin of this.orderPlugins) {
        dirs.push(plugin.path);
      }
    }

    // egg 框架路径，在 lib/core 目录下
    for (const eggPath of this.eggPaths) {
      dirs.push(path.join(eggPath, 'lib/core'));
    }

    // 应用目录
    dirs.push(this.options.baseDir);

    debug('Loaded dirs %j', dirs);
    return dirs;
  }

  /**
   * 返回应用 appname，默认获取 pkg.name
   *
   * @return {String} appname
   * @private
   */
  getAppname() {
    if (this.pkg.name) {
      debug('Loaded appname(%s) from package.json', this.pkg.name);
      return this.pkg.name;
    }
    throw new Error('Can not get appname from package.json');
  }

  loadTo(directory, target, opt) {
    opt = Object.assign({}, {
      directory,
      target,
      inject: this.app,
    }, opt);
    new Loader(opt).load();
  }

  loadToApp(directory, field, opt) {
    const target = this.app[field] = {};
    this.loadTo(directory, target, opt);
  }

}

/**
 * Mixin loader 方法到 BaseLoader，class 不支持多类继承
 * // ES6 Multiple Inheritance
 * https://medium.com/@leocavalcante/es6-multiple-inheritance-73a3c66d2b6b
 */
const loaders = [
  require('./plugin_loader'),
  require('./config_loader'),
  require('./loader/extend'),
  require('./proxy_loader'),
  require('./service_loader'),
  require('./middleware_loader'),
];

for (const loader of loaders) {
  Object.assign(EggLoader.prototype, loader);
}

module.exports = EggLoader;

function isKoa(app) {
  return app.hasOwnProperty('use') &&
    app.hasOwnProperty('listen') &&
    Object.getPrototypeOf(app) === Emitter.prototype;
}
