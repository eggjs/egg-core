'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const isFunction = require('is-type-of').function;
const debug = require('debug')('egg-loader');
const Loader = require('./loader');
const ContextLoader = require('./context_loader');
const loadFile = require('./utils').loadFile;
const getHomedir = require('./utils').getHomedir;
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

    this.appInfo = {
      name: this.getAppname(),
      baseDir: this.options.baseDir,
      env: this.serverEnv,
      HOME: getHomedir(),
      pkg: this.pkg,
    };
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
   * Get appname from pkg.name
   *
   * @return {String} appname
   * @private
   */
  getAppname() {
    if (this.pkg.name) {
      debug('Loaded appname(%s) from package.json', this.pkg.name);
      return this.pkg.name;
    }
    const pkg = path.join(this.options.baseDir, 'package.json');
    throw new Error(`name is required from ${pkg}`);
  }

  /**
   * Get all framework directories.
   *
   * You can extend Application of egg, the entrypoint is options.app,
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

  // Low Level API

  /**
   * Load single file, will invork when export is function
   *
   * @param {String} filepath - fullpath
   * @param {Array} arguments - pass rest arguments into the function when invork
   * @return {Object} exports
   * @example
   * ```js
   * app.loader.loadFile(path.join(app.options.baseDir, 'config/router.js'));
   * ```
   */
  loadFile(filepath) {
    if (!fs.existsSync(filepath)) {
      return null;
    }

    const ret = loadFile(filepath);
    // function(arg1, args, ...) {}
    let inject = Array.prototype.slice.call(arguments, 1);
    if (inject.length === 0) inject = [ this.app ];
    return isFunction(ret) ? ret.apply(null, inject) : ret;
  }

  /**
   * Get all loadUnit
   *
   * loadUnit is a directory that can be loaded by EggLoader, it has the same structure.
   * loadUnit has a path and a type(app, framework, plugin).
   *
   * The order of the loadUnits:
   *
   * 1. plugin
   * 2. framework
   * 3. app
   *
   * @return {Array} loadUnits
   */
  getLoadUnits() {
    if (this.dirs) {
      return this.dirs;
    }

    const dirs = this.dirs = [];

    // 插件目录，master 没有 plugin
    if (this.orderPlugins) {
      for (const plugin of this.orderPlugins) {
        dirs.push({
          path: plugin.path,
          type: 'plugin',
        });
      }
    }

    // egg 框架路径
    for (const eggPath of this.eggPaths) {
      dirs.push({
        path: eggPath,
        type: 'framework',
      });
    }

    // 应用目录
    dirs.push({
      path: this.options.baseDir,
      type: 'app',
    });

    debug('Loaded dirs %j', dirs);
    return dirs;
  }

  loadToApp(directory, field, opt) {
    const target = this.app[field] = {};
    opt = Object.assign({}, {
      directory,
      target,
      inject: this.app,
    }, opt);
    new Loader(opt).load();
  }

  loadToContext(directory, field, opt) {
    opt = Object.assign({}, {
      directory,
      field,
      inject: this.app,
    }, opt);
    new ContextLoader(opt).load();
  }

}

/**
 * Mixin loader 方法到 BaseLoader，class 不支持多类继承
 * // ES6 Multiple Inheritance
 * https://medium.com/@leocavalcante/es6-multiple-inheritance-73a3c66d2b6b
 */
const loaders = [
  require('./mixin/plugin'),
  require('./mixin/config'),
  require('./mixin/extend'),
  require('./mixin/custom'),
  require('./mixin/proxy'),
  require('./mixin/service'),
  require('./mixin/middleware'),
  require('./mixin/controller'),
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
