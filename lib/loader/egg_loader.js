'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const isFunction = require('is-type-of').function;
const debug = require('debug')('egg-core');
const FileLoader = require('./file_loader');
const ContextLoader = require('./context_loader');
const loadFile = require('../utils').loadFile;
const getHomedir = require('../utils').getHomedir;
const EggCore = require('../egg');

class EggLoader {

  /**
   * @constructor
   * @param {Object} options - options
   * @param {String} options.baseDir - the directory of application
   * @param {Object} options.app - Application instance
   * @param {Logger} options.logger - logger
   * @param {Object} [options.plugins] - custom plugins
   * @since 1.0.0
   */
  constructor(options) {
    this.options = options;
    assert(fs.existsSync(this.options.baseDir), `${this.options.baseDir} not exists`);
    assert(this.options.app, 'options.app is required');
    assert(this.options.logger, 'options.logger is required');
    debug('EggLoader options %j', options);

    this.app = this.options.app;

    /**
     * @member {Object} EggLoader#pkg
     * @since 1.0.0
     */
    this.pkg = require(path.join(this.options.baseDir, 'package.json'));

    /**
     * @member {Array} EggLoader#eggPaths
     * @since 1.0.0
     * @see EggLoader#getEggPaths
     */
    this.eggPaths = this.getEggPaths();
    debug('Loaded eggPaths %j', this.eggPaths);

    /**
     * @member {String} EggLoader#serverEnv
     * @since 1.0.0
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
   * @since 1.0.0
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
   * @since 1.0.0
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
   * @since 1.0.0
   */
  getEggPaths() {
    const eggPaths = [];

    let proto = this.app;
    // Loop for the prototype chain
    while (proto) {
      proto = Object.getPrototypeOf(proto);
      // stop the loop if
      // - object extends Object
      // - object extends EggCore
      if (proto === Object.prototype || proto === EggCore.prototype) {
        break;
      }

      assert(proto.hasOwnProperty(Symbol.for('egg#eggPath')), 'Symbol.for(\'egg#eggPath\') is required on Application');
      const eggPath = proto[Symbol.for('egg#eggPath')];
      // 使用 fs.realpathSync 来找到最终路径
      const realpath = fs.realpathSync(eggPath);
      if (eggPaths.indexOf(realpath) === -1) {
        eggPaths.unshift(realpath);
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
   * @since 1.0.0
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
   * @since 1.0.0
   */
  getLoadUnits() {
    if (this.dirs) {
      return this.dirs;
    }

    const dirs = this.dirs = [];

    if (this.orderPlugins) {
      for (const plugin of this.orderPlugins) {
        dirs.push({
          path: plugin.path,
          type: 'plugin',
        });
      }
    }

    // framework or egg path
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

  loadToApp(directory, property, opt) {
    const target = this.app[property] = {};
    opt = Object.assign({}, {
      directory,
      target,
      inject: this.app,
    }, opt);
    new FileLoader(opt).load();
  }

  loadToContext(directory, property, opt) {
    opt = Object.assign({}, {
      directory,
      property,
      inject: this.app,
    }, opt);
    new ContextLoader(opt).load();
  }

  get FileLoader() {
    return FileLoader;
  }

  get ContextLoader() {
    return ContextLoader;
  }

}

/**
 * Mixin methods to EggLoader
 * // ES6 Multiple Inheritance
 * https://medium.com/@leocavalcante/es6-multiple-inheritance-73a3c66d2b6b
 */
const loaders = [
  require('./mixin/plugin'),
  require('./mixin/config'),
  require('./mixin/extend'),
  require('./mixin/custom'),
  require('./mixin/service'),
  require('./mixin/middleware'),
  require('./mixin/controller'),
  require('./mixin/router'),
];

for (const loader of loaders) {
  Object.assign(EggLoader.prototype, loader);
}

module.exports = EggLoader;
