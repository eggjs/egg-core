import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { debuglog } from 'node:util';
import { isClass } from 'is-type-of';
import homedir from 'node-homedir';
import type { Logger } from 'egg-logger';
import { readJSONSync } from 'utility';
import { extend } from 'extend2';
import { FileLoader, FileLoaderOptions } from './file_loader.js';
import { ContextLoader, ContextLoaderOptions } from './context_loader.js'
import utils from '../utils/index.js';
import sequencify from '../utils/sequencify.js';
import { Timing } from '../utils/timing.js';
import type { EggCore } from '../egg.js';

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

export interface EggPluginInfo {
  /** the plugin name, it can be used in `dep` */
  name: string;
  /** the package name of plugin */
  package?: string;
  version?: string;
  /** whether enabled */
  enable: boolean;
  implicitEnable?: boolean;
  /** the directory of the plugin package */
  path?: string;
  /** the dependent plugins, you can use the plugin name */
  dependencies: string[];
  /** the optional dependent plugins. */
  optionalDependencies: string[];
  dependents?: string[];
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
  EggCoreClass?: typeof EggCore;
  /** the directory of application */
  baseDir: string;
  /** egg logger */
  logger: Logger;
  /** server scope */
  serverScope?: string;
  /** custom plugins */
  plugins?: Record<string, EggPluginInfo>;
}

export type EggDirInfoType = 'app' | 'plugin' | 'framework';

export interface EggDirInfo {
  path: string;
  type: EggDirInfoType;
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
  dirs?: EggDirInfo[];


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
    this.pkg = readJSONSync(path.join(this.options.baseDir, 'package.json'));

    // auto require('tsconfig-paths/register') on typescript app
    // support env.EGG_TYPESCRIPT = true or { "egg": { "typescript": true } } on package.json
    if (process.env.EGG_TYPESCRIPT === 'true' || (this.pkg.egg && this.pkg.egg.typescript)) {
      // skip require tsconfig-paths if tsconfig.json not exists
      const tsConfigFile = path.join(this.options.baseDir, 'tsconfig.json');
      if (fs.existsSync(tsConfigFile)) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('tsconfig-paths').register({ cwd: this.options.baseDir });
      } else {
        this.logger.info('[egg-core:egg_loader] skip register "tsconfig-paths" because tsconfig.json not exists at %s',
          tsConfigFile);
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
  getAppname(): string {
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
  getHomedir(): string {
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
    const EggCore = this.options.EggCoreClass!;
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
      const eggPath = Reflect.get(proto, Symbol.for('egg#eggPath'));
      assert(eggPath && typeof eggPath === 'string', 'Symbol.for(\'egg#eggPath\') should be string');
      assert(fs.existsSync(eggPath), `${eggPath} not exists`);
      const realpath = fs.realpathSync(eggPath);
      if (!eggPaths.includes(realpath)) {
        eggPaths.unshift(realpath);
      }
    }

    return eggPaths;
  }

  /** start Plugin loader */
  lookupDirs: Set<string>;
  eggPlugins: Record<string, EggPluginInfo>;
  appPlugins: Record<string, EggPluginInfo>;
  customPlugins: Record<string, EggPluginInfo>;
  allPlugins: Record<string, EggPluginInfo>;
  orderPlugins: EggPluginInfo[];
  /** enable plugins */
  plugins: Record<string, EggPluginInfo>;

  /**
   * Load config/plugin.js from {EggLoader#loadUnits}
   *
   * plugin.js is written below
   *
   * ```js
   * {
   *   'xxx-client': {
   *     enable: true,
   *     package: 'xxx-client',
   *     dep: [],
   *     env: [],
   *   },
   *   // short hand
   *   'rds': false,
   *   'depd': {
   *     enable: true,
   *     path: 'path/to/depd'
   *   }
   * }
   * ```
   *
   * If the plugin has path, Loader will find the module from it.
   *
   * Otherwise Loader will lookup follow the order by packageName
   *
   * 1. $APP_BASE/node_modules/${package}
   * 2. $EGG_BASE/node_modules/${package}
   *
   * You can call `loader.plugins` that retrieve enabled plugins.
   *
   * ```js
   * loader.plugins['xxx-client'] = {
   *   name: 'xxx-client',                 // the plugin name, it can be used in `dep`
   *   package: 'xxx-client',              // the package name of plugin
   *   enable: true,                       // whether enabled
   *   path: 'path/to/xxx-client',         // the directory of the plugin package
   *   dep: [],                            // the dependent plugins, you can use the plugin name
   *   env: [ 'local', 'unittest' ],       // specify the serverEnv that only enable the plugin in it
   * }
   * ```
   *
   * `loader.allPlugins` can be used when retrieve all plugins.
   * @function EggLoader#loadPlugin
   * @since 1.0.0
   */
  async loadPlugin() {
    this.timing.start('Load Plugin');

    this.lookupDirs = this.getLookupDirs();
    this.allPlugins = {};
    this.eggPlugins = await this.loadEggPlugins();
    this.appPlugins = await this.loadAppPlugins();
    this.customPlugins = this.loadCustomPlugins();

    this.#extendPlugins(this.allPlugins, this.eggPlugins);
    this.#extendPlugins(this.allPlugins, this.appPlugins);
    this.#extendPlugins(this.allPlugins, this.customPlugins);

    const enabledPluginNames: string[] = []; // enabled plugins that configured explicitly
    const plugins: Record<string, EggPluginInfo> = {};
    const env = this.serverEnv;
    for (const name in this.allPlugins) {
      const plugin = this.allPlugins[name];

      // resolve the real plugin.path based on plugin or package
      plugin.path = this.getPluginPath(plugin);

      // read plugin information from ${plugin.path}/package.json
      this.#mergePluginConfig(plugin);

      // disable the plugin that not match the serverEnv
      if (env && plugin.env.length > 0 && !plugin.env.includes(env)) {
        this.logger.info('[@eggjs/core] Plugin %o is disabled by env unmatched, require env(%o) but got env is %o',
          name, plugin.env, env);
        plugin.enable = false;
        continue;
      }

      plugins[name] = plugin;
      if (plugin.enable) {
        enabledPluginNames.push(name);
      }
    }

    // retrieve the ordered plugins
    this.orderPlugins = this.getOrderPlugins(plugins, enabledPluginNames, this.appPlugins);

    const enablePlugins: Record<string, EggPluginInfo> = {};
    for (const plugin of this.orderPlugins) {
      enablePlugins[plugin.name] = plugin;
    }
    debug('Loaded plugins: %j', Object.keys(enablePlugins));

    /**
     * Retrieve enabled plugins
     * @member {Object} EggLoader#plugins
     * @since 1.0.0
     */
    this.plugins = enablePlugins;
    this.timing.end('Load Plugin');
  }

  protected async loadAppPlugins() {
    // loader plugins from application
    const appPlugins = await this.readPluginConfigs(path.join(this.options.baseDir, 'config/plugin.default'));
    debug('Loaded app plugins: %j', Object.keys(appPlugins));
    return appPlugins;
  }

  protected async loadEggPlugins() {
    // loader plugins from framework
    const eggPluginConfigPaths = this.eggPaths.map(eggPath => path.join(eggPath, 'config/plugin.default'));
    const eggPlugins = await this.readPluginConfigs(eggPluginConfigPaths);
    debug('Loaded egg plugins: %j', Object.keys(eggPlugins));
    return eggPlugins;
  }

  protected loadCustomPlugins() {
    // loader plugins from process.env.EGG_PLUGINS
    let customPlugins: Record<string, EggPluginInfo> = {};
    const configPaths: string[] = [];
    if (process.env.EGG_PLUGINS) {
      try {
        customPlugins = JSON.parse(process.env.EGG_PLUGINS);
        configPaths.push('<process.env.EGG_PLUGINS>');
      } catch (e) {
        debug('parse EGG_PLUGINS failed, %s', e);
      }
    }

    // loader plugins from options.plugins
    if (this.options.plugins) {
      customPlugins = {
        ...customPlugins,
        ...this.options.plugins,
      };
      configPaths.push('<options.plugins>');
    }

    if (customPlugins) {
      const configPath = configPaths.join(' or '); 
      for (const name in customPlugins) {
        this.#normalizePluginConfig(customPlugins, name, configPath);
      }
      debug('Loaded custom plugins: %j', Object.keys(customPlugins));
    }
    return customPlugins;
  }

  /*
   * Read plugin.js from multiple directory
   */
  protected async readPluginConfigs(configPaths: string[] | string) {
    if (!Array.isArray(configPaths)) {
      configPaths = [ configPaths ];
    }

    // Get all plugin configurations
    // plugin.default.js
    // plugin.${scope}.js
    // plugin.${env}.js
    // plugin.${scope}_${env}.js
    const newConfigPaths: string[] = [];
    for (const filename of this.getTypeFiles('plugin')) {
      for (let configPath of configPaths) {
        configPath = path.join(path.dirname(configPath), filename);
        newConfigPaths.push(configPath);
      }
    }

    const plugins: Record<string, EggPluginInfo> = {};
    for (const configPath of newConfigPaths) {
      let filepath = this.resolveModule(configPath);

      // let plugin.js compatible
      if (configPath.endsWith('plugin.default') && !filepath) {
        filepath = this.resolveModule(configPath.replace(/plugin\.default$/, 'plugin'));
      }

      if (!filepath) {
        continue;
      }

      const config = await utils.loadFile(filepath) as Record<string, EggPluginInfo>;
      for (const name in config) {
        this.#normalizePluginConfig(config, name, filepath);
      }
      this.#extendPlugins(plugins, config);
    }

    return plugins;
  }

  #normalizePluginConfig(plugins: Record<string, EggPluginInfo | boolean>, name: string, configPath: string) {
    const plugin = plugins[name];

    // plugin_name: false
    if (typeof plugin === 'boolean') {
      plugins[name] = {
        name,
        enable: plugin,
        dependencies: [],
        optionalDependencies: [],
        env: [],
        from: configPath,
        package: '',
        path: '',
      } satisfies EggPluginInfo;
      return;
    }

    if (typeof plugin.enable !== 'boolean') {
      plugin.enable = true;
    }
    plugin.name = name;
    plugin.dependencies = plugin.dependencies || [];
    plugin.optionalDependencies = plugin.optionalDependencies || [];
    plugin.env = plugin.env || [];
    plugin.from = configPath;
    depCompatible(plugin);
  }

  // Read plugin information from package.json and merge
  // {
  //   eggPlugin: {
  //     "name": "",     plugin name, must be same as name in config/plugin.js
  //     "dep": [],      dependent plugins
  //     "env": ""       env
  //     "strict": true, whether check plugin name, default to true.
  //   }
  // }
  #mergePluginConfig(plugin: EggPluginInfo) {
    let pkg;
    let config;
    const pluginPackage = path.join(plugin.path!, 'package.json');
    if (fs.existsSync(pluginPackage)) {
      pkg = readJSONSync(pluginPackage);
      config = pkg.eggPlugin;
      if (pkg.version) {
        plugin.version = pkg.version;
      }
    }

    const logger = this.options.logger;
    if (!config) {
      logger.warn(`[@eggjs/core:egg_loader] pkg.eggPlugin is missing in ${pluginPackage}`);
      return;
    }

    if (config.name && config.strict !== false && config.name !== plugin.name) {
      // pluginName is configured in config/plugin.js
      // pluginConfigName is pkg.eggPlugin.name
      logger.warn(`[@eggjs/core:egg_loader] pluginName(${plugin.name}) is different from pluginConfigName(${config.name})`);
    }

    // dep compatible
    depCompatible(config);

    for (const key of [ 'dependencies', 'optionalDependencies', 'env' ]) {
      const values = config[key];
      const existsValues = Reflect.get(plugin, key);
      if (Array.isArray(values) && !existsValues?.length) {
        Reflect.set(plugin, key, values);
      }
    }
  }

  protected getOrderPlugins(allPlugins: Record<string, EggPluginInfo>, enabledPluginNames: string[],
    appPlugins: Record<string, EggPluginInfo>) {
    // no plugins enabled
    if (!enabledPluginNames.length) {
      return [];
    }

    const result = sequencify(allPlugins, enabledPluginNames);
    debug('Got plugins %j after sequencify', result);

    // catch error when result.sequence is empty
    if (!result.sequence.length) {
      const err = new Error(
        `sequencify plugins has problem, missing: [${result.missingTasks}], recursive: [${result.recursiveDependencies}]`);
      // find plugins which is required by the missing plugin
      for (const missName of result.missingTasks) {
        const requires = [];
        for (const name in allPlugins) {
          if (allPlugins[name].dependencies.includes(missName)) {
            requires.push(name);
          }
        }
        err.message += `\n\t>> Plugin [${missName}] is disabled or missed, but is required by [${requires}]`;
      }

      err.name = 'PluginSequencifyError';
      throw err;
    }

    // log the plugins that be enabled implicitly
    const implicitEnabledPlugins: string[] = [];
    const requireMap: Record<string, string[]> = {};
    result.sequence.forEach(name => {
      for (const depName of allPlugins[name].dependencies) {
        if (!requireMap[depName]) {
          requireMap[depName] = [];
        }
        requireMap[depName].push(name);
      }

      if (!allPlugins[name].enable) {
        implicitEnabledPlugins.push(name);
        allPlugins[name].enable = true;
        allPlugins[name].implicitEnable = true;
      }
    });

    for (const [ name, dependents ] of Object.entries(requireMap)) {
      // note:`dependents` will not includes `optionalDependencies`
      allPlugins[name].dependents = dependents;
    }

    // Following plugins will be enabled implicitly.
    //   - configclient required by [hsfclient]
    //   - eagleeye required by [hsfclient]
    //   - diamond required by [hsfclient]
    if (implicitEnabledPlugins.length) {
      let message = implicitEnabledPlugins
        .map(name => `  - ${name} required by [${requireMap[name]}]`)
        .join('\n');
      this.options.logger.info(`Following plugins will be enabled implicitly.\n${message}`);

      // should warn when the plugin is disabled by app
      const disabledPlugins = implicitEnabledPlugins.filter(
        name => appPlugins[name] && appPlugins[name].enable === false);
      if (disabledPlugins.length) {
        message = disabledPlugins
          .map(name => `  - ${name} required by [${requireMap[name]}]`)
          .join('\n');
        this.options.logger.warn(
          `Following plugins will be enabled implicitly that is disabled by application.\n${message}`);
      }
    }

    return result.sequence.map(name => allPlugins[name]);
  }

  protected getLookupDirs() {
    const lookupDirs = new Set<string>();

    // try to locate the plugin in the following directories's node_modules
    // -> {APP_PATH} -> {EGG_PATH} -> $CWD
    lookupDirs.add(this.options.baseDir);

    // try to locate the plugin at framework from upper to lower
    for (let i = this.eggPaths.length - 1; i >= 0; i--) {
      const eggPath = this.eggPaths[i];
      lookupDirs.add(eggPath);
    }

    // should find the $cwd when test the plugins under npm3
    lookupDirs.add(process.cwd());
    return lookupDirs;
  }

  // Get the real plugin path
  protected getPluginPath(plugin: EggPluginInfo) {
    if (plugin.path) {
      return plugin.path;
    }

    if (plugin.package) {
      assert(isValidatePackageName(plugin.package),
        `plugin ${plugin.name} invalid, use 'path' instead of package: "${plugin.package}"`);
    }
    return this.#resolvePluginPath(plugin);
  }

  #resolvePluginPath(plugin: EggPluginInfo) {
    const name = plugin.package || plugin.name;

    try {
      // should find the plugin directory
      // pnpm will lift the node_modules to the sibling directory
      // 'node_modules/.pnpm/yadan@2.0.0/node_modules/yadan/node_modules',
      // 'node_modules/.pnpm/yadan@2.0.0/node_modules',  <- this is the sibling directory
      // 'node_modules/.pnpm/egg@2.33.1/node_modules/egg/node_modules',
      // 'node_modules/.pnpm/egg@2.33.1/node_modules', <- this is the sibling directory
      const filePath = utils.resolvePath(`${name}/package.json`, { paths: [ ...this.lookupDirs ] });
      return path.dirname(filePath);
    } catch (_) {
      throw new Error(`Can not find plugin ${name} in "${[ ...this.lookupDirs ].join(', ')}"`);
    }
  }

  #extendPlugins(target: Record<string, EggPluginInfo>, plugins: Record<string, EggPluginInfo>) {
    if (!plugins) {
      return;
    }
    for (const name in plugins) {
      const plugin = plugins[name];
      let targetPlugin = target[name];
      if (!targetPlugin) {
        targetPlugin = target[name] = {} as EggPluginInfo;
      }
      if (targetPlugin.package && targetPlugin.package === plugin.package) {
        this.logger.warn('[@eggjs/core] plugin %s has been defined that is %j, but you define again in %s',
          name, targetPlugin, plugin.from);
      }
      if (plugin.path || plugin.package) {
        delete targetPlugin.path;
        delete targetPlugin.package;
      }
      for (const [ prop, value ] of Object.entries(plugin)) {
        if (value === undefined) {
          continue;
        }
        if (prop in targetPlugin && Array.isArray(value) && !value.length) {
          continue;
        }
        Reflect.set(targetPlugin, prop, value);
      }
    }
  }
  /** end Plugin loader */

  /** start Config loader */
  configMeta: Record<string, any>;
  config: Record<string, any>;

  /**
   * Load config/config.js
   *
   * Will merge config.default.js 和 config.${env}.js
   *
   * @function EggLoader#loadConfig
   * @since 1.0.0
   */
  async loadConfig() {
    this.timing.start('Load Config');
    this.configMeta = {};

    const target: Record<string, any> = {};

    // Load Application config first
    const appConfig = await this.#preloadAppConfig();

    //   plugin config.default
    //     framework config.default
    //       app config.default
    //         plugin config.{env}
    //           framework config.{env}
    //             app config.{env}
    for (const filename of this.getTypeFiles('config')) {
      for (const unit of this.getLoadUnits()) {
        const isApp = unit.type === 'app';
        const config = this.#loadConfig(
          unit.path, filename, isApp ? undefined : appConfig, unit.type);
        if (!config) {
          continue;
        }
        debug('Loaded config %s/%s, %j', unit.path, filename, config);
        extend(true, target, config);
      }
    }

    // load env from process.env.EGG_APP_CONFIG
    const envConfig = this.#loadConfigFromEnv();
    debug('Loaded config from env, %j', envConfig);
    extend(true, target, envConfig);

    // You can manipulate the order of app.config.coreMiddleware and app.config.appMiddleware in app.js
    target.coreMiddleware = target.coreMiddlewares = target.coreMiddleware || [];
    target.appMiddleware = target.appMiddlewares = target.middleware || [];

    this.config = target;
    this.timing.end('Load Config');
  }

  async #preloadAppConfig() {
    const names = [
      'config.default',
      `config.${this.serverEnv}`,
    ];
    const target: Record<string, any> = {};
    for (const filename of names) {
      const config = await this.#loadConfig(this.options.baseDir, filename, undefined, 'app');
      if (!config) {
        continue;
      }
      extend(true, target, config);
    }
    return target;
  }

  async #loadConfig(dirpath: string, filename: string, extraInject: object | undefined, type: EggDirInfoType) {
    const isPlugin = type === 'plugin';
    const isApp = type === 'app';

    let filepath = this.resolveModule(path.join(dirpath, 'config', filename));
    // let config.js compatible
    if (filename === 'config.default' && !filepath) {
      filepath = this.resolveModule(path.join(dirpath, 'config/config'));
    }
    const config: Record<string, any> = await this.loadFile(filepath!, this.appInfo, extraInject);
    if (!config) return;
    if (isPlugin || isApp) {
      assert(!config.coreMiddleware, 'Can not define coreMiddleware in app or plugin');
    }
    if (!isApp) {
      assert(!config.middleware, 'Can not define middleware in ' + filepath);
    }
    // store config meta, check where is the property of config come from.
    this.#setConfigMeta(config, filepath!);
    return config;
  }

  #loadConfigFromEnv() {
    const envConfigStr = process.env.EGG_APP_CONFIG;
    if (!envConfigStr) return;
    try {
      const envConfig: Record<string, any> = JSON.parse(envConfigStr);
      this.#setConfigMeta(envConfig, '<process.env.EGG_APP_CONFIG>');
      return envConfig;
    } catch (err) {
      this.options.logger.warn('[egg-loader] process.env.EGG_APP_CONFIG is not invalid JSON: %s', envConfigStr);
    }
  }

  #setConfigMeta(config: Record<string, any>, filepath: string) {
    config = extend(true, {}, config);
    this.#setConfig(config, filepath);
    extend(true, this.configMeta, config);
  }

  #setConfig(obj: Record<string, any>, filepath: string) {
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      // ignore console
      if (key === 'console' && val && typeof val.Console === 'function' && val.Console === console.Console) {
        obj[key] = filepath;
        continue;
      }
      if (val && Object.getPrototypeOf(val) === Object.prototype && Object.keys(val).length > 0) {
        this.#setConfig(val, filepath);
        continue;
      }
      obj[key] = filepath;
    }
  }
  /** end Config loader */

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
  async loadFile(filepath: string, ...inject: any[]) {
    const fullpath = filepath && this.resolveModule(filepath);
    if (!fullpath) {
      return null;
    }

    // function(arg1, args, ...) {}
    if (inject.length === 0) inject = [ this.app ];
    let mod = await this.requireFile(fullpath);
    if (typeof mod === 'function' && !isClass(mod)) {
      mod = mod(...inject);
    }
    return mod;
  }

  /**
   * @param {String} filepath - fullpath
   * @return {Object} exports
   * @private
   */
  async requireFile(filepath: string) {
    const timingKey = `Require(${this.#requiredCount++}) ${utils.getResolvedFilename(filepath, this.options.baseDir)}`;
    this.timing.start(timingKey);
    const mod = await utils.loadFile(filepath);
    this.timing.end(timingKey);
    return mod;
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
  getLoadUnits(): EggDirInfo[] {
    if (this.dirs) {
      return this.dirs;
    }

    this.dirs = [];

    if (this.orderPlugins) {
      for (const plugin of this.orderPlugins) {
        this.dirs.push({
          path: plugin.path,
          type: 'plugin',
        });
      }
    }

    // framework or egg path
    for (const eggPath of this.eggPaths) {
      this.dirs.push({
        path: eggPath,
        type: 'framework',
      });
    }

    // application
    this.dirs.push({
      path: this.options.baseDir,
      type: 'app',
    });

    debug('Loaded dirs %j', this.dirs);
    return this.dirs;
  }

  /**
   * Load files using {@link FileLoader}, inject to {@link Application}
   * @param {String|Array} directory - see {@link FileLoader}
   * @param {String} property - see {@link FileLoader}
   * @param {Object} options - see {@link FileLoader}
   * @since 1.0.0
   */
  async loadToApp(directory: string | string[], property: string, options: FileLoaderOptions) {
    const target = {};
    Reflect.set(this.app, property, target);
    options = {
      ...options,
      directory,
      target,
      inject: this.app,
    };

    const timingKey = `Load "${String(property)}" to Application`;
    this.timing.start(timingKey);
    await new FileLoader(options).load();
    this.timing.end(timingKey);
  }

  /**
   * Load files using {@link ContextLoader}
   * @param {String|Array} directory - see {@link ContextLoader}
   * @param {String} property - see {@link ContextLoader}
   * @param {Object} options - see {@link ContextLoader}
   * @since 1.0.0
   */
  async loadToContext(directory: string | string[], property: string, options: ContextLoaderOptions) {
    options = {
      ...options,
      directory,
      property,
      inject: this.app,
    };

    const timingKey = `Load "${String(property)}" to Context`;
    this.timing.start(timingKey);
    await new ContextLoader(options).load();
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

  getTypeFiles(filename: string) {
    const files = [ `${filename}.default` ];
    if (this.serverScope) files.push(`${filename}.${this.serverScope}`);
    if (this.serverEnv === 'default') return files;
    files.push(`${filename}.${this.serverEnv}`);
    if (this.serverScope) {
      files.push(`${filename}.${this.serverScope}_${this.serverEnv}`);
    }
    return files;
  }

  resolveModule(filepath: string) {
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

function depCompatible(plugin: EggPluginInfo & { dep?: string[] }) {
  if (plugin.dep && !(Array.isArray(plugin.dependencies) && plugin.dependencies.length)) {
    plugin.dependencies = plugin.dep;
    delete plugin.dep;
  }
}

function isValidatePackageName(name: string) {
  // only check file path style
  if (name.startsWith('.')) return false;
  if (name.startsWith('/')) return false;
  if (name.includes(':')) return false;
  return true;
}


/**
 * Mixin methods to EggLoader
 * // ES6 Multiple Inheritance
 * https://medium.com/@leocavalcante/es6-multiple-inheritance-73a3c66d2b6b
 */
// const loaders = [
//   require('./mixin/config'),
//   require('./mixin/extend'),
//   require('./mixin/custom'),
//   require('./mixin/service'),
//   require('./mixin/middleware'),
//   require('./mixin/controller'),
//   require('./mixin/router'),
//   require('./mixin/custom_loader'),
// ];

// for (const loader of loaders) {
//   Object.assign(EggLoader.prototype, loader);
// }


// // https://www.typescriptlang.org/docs/handbook/mixins.html#alternative-pattern
// export interface EggLoaderMixin extends PluginLoader, ConfigLoader {}

// // https://www.typescriptlang.org/docs/handbook/mixins.html
// function applyMixins(derivedCtor: any, constructors: any[]) {
//   constructors.forEach(baseCtor => {
//     Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
//       if (derivedCtor.prototype.hasOwnProperty(name)) {
//         return;
//       }
//       Object.defineProperty(
//         derivedCtor.prototype,
//         name,
//         Object.getOwnPropertyDescriptor(baseCtor.prototype, name) ||
//           Object.create(null),
//       );
//     });
//   });
// }

// applyMixins(EggLoader, [ PluginLoader, ConfigLoader ]);
