import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { debuglog } from 'node:util';
import is from 'is-type-of';
import homedir from 'node-homedir';
import type { Logger } from 'egg-logger';
import FileLoader from './file_loader';
import ContextLoader from './context_loader';
import utility from 'utility';
import utils from '../utils';
import { Timing } from '../utils/timing';
import type { EggCore } from '../egg';

const debug = debuglog('@eggjs/core:egg_loader');

export interface EggAppInfo {
  /** package.json */
  pkg: Record<string, any>;
  /** the application name from package.json */
  name: string;
  /** current directory of application */
  baseDir: string;
  /** equals to serverEnv */
  env: string;
  /** equals to serverScope */
  scope: string;
  /** home directory of the OS */
  HOME: string;
  /** baseDir when local and unittest, HOME when other environment */
  root: string;
}

export interface PluginInfo {
  /** the plugin name, it can be used in `dep` */
  name: string;
  /** the package name of plugin */
  package: string;
  /** whether enabled */
  enable: boolean;
  /** the directory of the plugin package */
  path: string;
  /** the dependent plugins, you can use the plugin name */
  dependencies: string[];
  /** the optional dependent plugins. */
  optionalDependencies: string[];
  /** specify the serverEnv that only enable the plugin in it */
  env: string[];
  /** the file plugin config in. */
  from: string;
}

export interface EggLoaderOptions {
  /** server env */
  env: string;
  /** Application instance */
  app: EggCore;
  /** the directory of application */
  baseDir: string;
  /** egg logger */
  logger: Logger;
  /** server scope */
  serverScope?: string;
  /** custom plugins */
  plugins?: Record<string, PluginInfo>;
}

export class EggLoader {
  #requiredCount: 0;
  readonly options: EggLoaderOptions;
  readonly timing: Timing;
  readonly pkg: Record<string, any>;
  readonly eggPaths: string[];
  readonly serverEnv: string;
  readonly serverScope: string;
  readonly appInfo: EggAppInfo;

  /**
   * @class
   * @param {Object} options - options
   * @param {String} options.baseDir - the directory of application
   * @param {EggCore} options.app - Application instance
   * @param {Logger} options.logger - logger
   * @param {Object} [options.plugins] - custom plugins
   * @since 1.0.0
   */
  constructor(options: EggLoaderOptions) {
    this.options = options;
    assert(fs.existsSync(this.options.baseDir), `${this.options.baseDir} not exists`);
    assert(this.options.app, 'options.app is required');
    assert(this.options.logger, 'options.logger is required');

    this.timing = this.app.timing || new Timing();

    /**
     * @member {Object} EggLoader#pkg
     * @see {@link AppInfo#pkg}
     * @since 1.0.0
     */
    this.pkg = utility.readJSONSync(path.join(this.options.baseDir, 'package.json'));

    // auto require('tsconfig-paths/register') on typescript app
    // support env.EGG_TYPESCRIPT = true or { "egg": { "typescript": true } } on package.json
    if (process.env.EGG_TYPESCRIPT === 'true' || (this.pkg.egg && this.pkg.egg.typescript)) {
      // skip require tsconfig-paths if tsconfig.json not exists
      const tsConfigFile = path.join(this.options.baseDir, 'tsconfig.json');
      if (fs.existsSync(tsConfigFile)) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('tsconfig-paths').register({ cwd: this.options.baseDir });
      } else {
        this.logger.info('[egg:loader] skip register "tsconfig-paths" because tsconfig.json not exists at %s', tsConfigFile);
      }
    }

    /**
     * All framework directories.
     *
     * You can extend Application of egg, the entry point is options.app,
     *
     * loader will find all directories from the prototype of Application,
     * you should define `Symbol.for('egg#eggPath')` property.
     *
     * ```
     * // lib/example.js
     * const egg = require('egg');
     * class ExampleApplication extends egg.Application {
     *   constructor(options) {
     *     super(options);
     *   }
     *
     *   get [Symbol.for('egg#eggPath')]() {
     *     return path.join(__dirname, '..');
     *   }
     * }
     * ```
     * @member {Array} EggLoader#eggPaths
     * @see EggLoader#getEggPaths
     * @since 1.0.0
     */
    this.eggPaths = this.getEggPaths();
    debug('Loaded eggPaths %j', this.eggPaths);

    /**
     * @member {String} EggLoader#serverEnv
     * @see AppInfo#env
     * @since 1.0.0
     */
    this.serverEnv = this.getServerEnv();
    debug('Loaded serverEnv %j', this.serverEnv);

    /**
     * @member {String} EggLoader#serverScope
     * @see AppInfo#serverScope
     */
    this.serverScope = options.serverScope !== undefined
      ? options.serverScope
      : this.getServerScope();

    /**
     * @member {AppInfo} EggLoader#appInfo
     * @since 1.0.0
     */
    this.appInfo = this.getAppInfo();
  }

  get app() {
    return this.options.app;
  }

  get lifecycle() {
    return this.app.lifecycle;
  }

  get logger() {
    return this.options.logger;
  }

  /**
   * Get {@link AppInfo#env}
   * @return {String} env
   * @see AppInfo#env
   * @private
   * @since 1.0.0
   */
  protected getServerEnv(): string {
    let serverEnv = this.options.env;

    const envPath = path.join(this.options.baseDir, 'config/env');
    if (!serverEnv && fs.existsSync(envPath)) {
      serverEnv = fs.readFileSync(envPath, 'utf8').trim();
    }

    if (!serverEnv && process.env.EGG_SERVER_ENV) {
      serverEnv = process.env.EGG_SERVER_ENV;
    }

    if (!serverEnv) {
      if (process.env.NODE_ENV === 'test') {
        serverEnv = 'unittest';
      } else if (process.env.NODE_ENV === 'production') {
        serverEnv = 'prod';
      } else {
        serverEnv = 'local';
      }
    } else {
      serverEnv = serverEnv.trim();
    }

    return serverEnv;
  }

  /**
   * Get {@link AppInfo#scope}
   * @return {String} serverScope
   * @private
   */
  protected getServerScope(): string {
    return process.env.EGG_SERVER_SCOPE || '';
  }

  /**
   * Get {@link AppInfo#name}
   * @return {String} appname
   * @private
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
   * Get home directory
   * @return {String} home directory
   * @since 3.4.0
   */
  getHomedir() {
    // EGG_HOME for test
    return process.env.EGG_HOME || homedir() || '/home/admin';
  }

  /**
   * Get app info
   * @return {AppInfo} appInfo
   * @since 1.0.0
   */
  protected getAppInfo(): EggAppInfo {
    const env = this.serverEnv;
    const scope = this.serverScope;
    const home = this.getHomedir();
    const baseDir = this.options.baseDir;

    /**
     * Meta information of the application
     * @class AppInfo
     */
    return {
      /**
       * The name of the application, retrieve from the name property in `package.json`.
       * @member {String} AppInfo#name
       */
      name: this.getAppname(),

      /**
       * The current directory, where the application code is.
       * @member {String} AppInfo#baseDir
       */
      baseDir,

      /**
       * The environment of the application, **it's not NODE_ENV**
       *
       * 1. from `$baseDir/config/env`
       * 2. from EGG_SERVER_ENV
       * 3. from NODE_ENV
       *
       * env | description
       * ---       | ---
       * test      | system integration testing
       * prod      | production
       * local     | local on your own computer
       * unittest  | unit test
       *
       * @member {String} AppInfo#env
       * @see https://eggjs.org/zh-cn/basics/env.html
       */
      env,

      /**
       * @member {String} AppInfo#scope
       */
      scope,

      /**
       * The use directory, same as `process.env.HOME`
       * @member {String} AppInfo#HOME
       */
      HOME: home,

      /**
       * parsed from `package.json`
       * @member {Object} AppInfo#pkg
       */
      pkg: this.pkg,

      /**
       * The directory whether is baseDir or HOME depend on env.
       * it's good for test when you want to write some file to HOME,
       * but don't want to write to the real directory,
       * so use root to write file to baseDir instead of HOME when unittest.
       * keep root directory in baseDir when local and unittest
       * @member {String} AppInfo#root
       */
      root: env === 'local' || env === 'unittest' ? baseDir : home,
    };
  }

  /**
   * Get {@link EggLoader#eggPaths}
   * @return {Array} framework directories
   * @see {@link EggLoader#eggPaths}
   * @private
   * @since 1.0.0
   */
  protected getEggPaths(): string[] {
    // avoid require recursively
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const EggCore = require('../egg').EggCore;
    const eggPaths: string[] = [];

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
      assert(eggPath && typeof eggPath === 'string', 'Symbol.for(\'egg#eggPath\') should be string');
      assert(fs.existsSync(eggPath), `${eggPath} not exists`);
      const realpath = fs.realpathSync(eggPath);
      if (!eggPaths.includes(realpath)) {
        eggPaths.unshift(realpath);
      }
    }

    return eggPaths;
  }

  // Low Level API

  /**
   * Load single file, will invoke when export is function
   *
   * @param {String} filepath - fullpath
   * @param {Array} inject - pass rest arguments into the function when invoke
   * @return {Object} exports
   * @example
   * ```js
   * app.loader.loadFile(path.join(app.options.baseDir, 'config/router.js'));
   * ```
   * @since 1.0.0
   */
  loadFile(filepath, ...inject) {
    filepath = filepath && this.resolveModule(filepath);
    if (!filepath) {
      return null;
    }

    // function(arg1, args, ...) {}
    if (inject.length === 0) inject = [ this.app ];

    let ret = this.requireFile(filepath);
    if (is.function(ret) && !is.class(ret)) {
      ret = ret(...inject);
    }
    return ret;
  }

  /**
   * @param {String} filepath - fullpath
   * @return {Object} exports
   * @private
   */
  requireFile(filepath) {
    const timingKey = `Require(${this.#requiredCount++}) ${utils.getResolvedFilename(filepath, this.options.baseDir)}`;
    this.timing.start(timingKey);
    const ret = utils.loadFile(filepath);
    this.timing.end(timingKey);
    return ret;
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

    // application
    dirs.push({
      path: this.options.baseDir,
      type: 'app',
    });

    debug('Loaded dirs %j', dirs);
    return dirs;
  }

  /**
   * Load files using {@link FileLoader}, inject to {@link Application}
   * @param {String|Array} directory - see {@link FileLoader}
   * @param {String} property - see {@link FileLoader}
   * @param {Object} opt - see {@link FileLoader}
   * @since 1.0.0
   */
  loadToApp(directory, property, opt) {
    const target = this.app[property] = {};
    opt = Object.assign({}, {
      directory,
      target,
      inject: this.app,
    }, opt);

    const timingKey = `Load "${String(property)}" to Application`;
    this.timing.start(timingKey);
    new FileLoader(opt).load();
    this.timing.end(timingKey);
  }

  /**
   * Load files using {@link ContextLoader}
   * @param {String|Array} directory - see {@link ContextLoader}
   * @param {String} property - see {@link ContextLoader}
   * @param {Object} opt - see {@link ContextLoader}
   * @since 1.0.0
   */
  loadToContext(directory, property, opt) {
    opt = Object.assign({}, {
      directory,
      property,
      inject: this.app,
    }, opt);

    const timingKey = `Load "${String(property)}" to Context`;
    this.timing.start(timingKey);
    new ContextLoader(opt).load();
    this.timing.end(timingKey);
  }

  /**
   * @member {FileLoader} EggLoader#FileLoader
   * @since 1.0.0
   */
  get FileLoader() {
    return FileLoader;
  }

  /**
   * @member {ContextLoader} EggLoader#ContextLoader
   * @since 1.0.0
   */
  get ContextLoader() {
    return ContextLoader;
  }

  getTypeFiles(filename) {
    const files = [ `${filename}.default` ];
    if (this.serverScope) files.push(`${filename}.${this.serverScope}`);
    if (this.serverEnv === 'default') return files;

    files.push(`${filename}.${this.serverEnv}`);
    if (this.serverScope) files.push(`${filename}.${this.serverScope}_${this.serverEnv}`);
    return files;
  }

  resolveModule(filepath) {
    let fullPath;
    try {
      fullPath = require.resolve(filepath);
    } catch (e) {
      return undefined;
    }

    if (process.env.EGG_TYPESCRIPT !== 'true' && fullPath.endsWith('.ts')) {
      return undefined;
    }

    return fullPath;
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
  require('./mixin/custom_loader'),
];

for (const loader of loaders) {
  Object.assign(EggLoader.prototype, loader);
}

import { PluginLoader } from './mixin/plugin.js';
import ConfigLoader from './mixin/config.js';

// https://www.typescriptlang.org/docs/handbook/mixins.html#alternative-pattern
export interface EggLoaderMixin extends PluginLoader, ConfigLoader {}

// https://www.typescriptlang.org/docs/handbook/mixins.html
function applyMixins(derivedCtor: any, constructors: any[]) {
  constructors.forEach(baseCtor => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
      if (derivedCtor.prototype.hasOwnProperty(name)) {
        return;
      }
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name) ||
          Object.create(null),
      );
    });
  });
}

applyMixins(EggLoader, [ PluginLoader, ConfigLoader ]);
