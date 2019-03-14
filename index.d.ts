import KoaApplication = require('koa');
import { Logger, EggConsoleLogger } from 'egg-logger';
import depd = require('depd');

type EggType = 'application' | 'agent';

interface PlainObject<T = any> {
  [key: string]: T;
}

export interface EggCoreOptions {
  type?: EggType;
  baseDir?: string;
  serverScope?: string;
  plugins?: Plugins;
}

export interface EggLoaderOptions {
  app: EggCore;
  baseDir: string;
  logger: Logger;
  serverScope?: string;
  plugins?: Plugins;
}

export interface PluginInfo {
  name: string; // the plugin name, it can be used in `dep`
  package: string; // the package name of plugin
  enable: boolean; // whether enabled
  path: string; // the directory of the plugin package
  dep: string[]; // the dependent plugins, you can use the plugin name
  env: string[]; // specify the serverEnv that only enable the plugin in it
}

export interface Plugins {
  [key: string]: PluginInfo;
}

export class EggCore<Config = any> extends KoaApplication {
  /**
   * Whether `application` or `agent`
   * @member {String}
   * @since 1.0.0
   */
  type: EggType;

  /**
   * The current directory of application
   * @member {String}
   * @see {@link AppInfo#baseDir}
   * @since 1.0.0
   */
  baseDir: string;

  /**
   * The name of application
   * @member {String}
   * @see {@link AppInfo#name}
   * @since 1.0.0
   */
  name: string;

  /**
   * @constructor
   * @param {Object} options - options
   * @param {String} [options.baseDir=process.cwd()] - the directory of application
   * @param {String} [options.type=application|agent] - whether it's running in app worker or agent worker
   * @param {Object} [options.plugins] - custom plugins
   * @since 1.0.0
   */
  constructor(options?: EggCoreOptions);

  /**
   * Convert a generator function to a promisable one.
   *
   * Notice: for other kinds of functions, it directly returns you what it is.
   *
   * @param  {Function} fn The inputted function.
   * @return {AsyncFunction} An async promise-based function.
   * @example
   * ```javascript
   *  const fn = function* (arg) {
        return arg;
      };
      const wrapped = app.toAsyncFunction(fn);
      wrapped(true).then((value) => console.log(value));
   * ```
   */
  toAsyncFunction<T = any>(fn: (...args: any[]) => IterableIterator<T>): (...args: any[]) => Promise<T>;

  /**
   * Convert an object with generator functions to a Promisable one.
   * @param  {Mixed} obj The inputted object.
   * @return {Promise} A Promisable result.
   * @example
   * ```javascript
   *  const fn = function* (arg) {
        return arg;
      };
      const arr = [ fn(1), fn(2) ];
      const promise = app.toPromise(arr);
      promise.then(res => console.log(res));
   * ```
   */
  toPromise<T = any>(obj: any): Promise<T>;

  /**
   * register an callback function that will be invoked when application is ready.
   * @see https://github.com/node-modules/ready
   * @since 1.0.0
   * @param {boolean|Error|Function} flagOrFunction -
   * @return {Promise|null} return promise when argument is undefined
   * @example
   * const app = new Application(...);
   * app.ready(err => {
   *   if (err) throw err;
   *   console.log('done');
   * });
   */
  ready(fn?: (err?: Error) => void): any;

  /**
   * Close all, it wil close
   * - callbacks registered by beforeClose
   * - emit `close` event
   * - remove add listeners
   *
   * If error is thrown when it's closing, the promise will reject.
   * It will also reject after following call.
   * @return {Promise} promise
   * @since 1.0.0
   */
  close(): Promise<any>;

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
  readyCallback(name: string, opts?: { timeout?: number; isWeakDep?: boolean }): () => void;

  /**
   * The loader instance, the default class is {@link EggLoader}.
   * If you want define
   * @member {EggLoader} EggCore#loader
   * @since 1.0.0
   */
  loader: EggLoader<this, Config>;

  /**
   * The configuration of application
   * @member {Config}
   * @since 1.0.0
   */
  config: Config;

  /**
   * Retrieve enabled plugins
   * @member {Object}
   * @since 1.0.0
   */
  plugins: Plugins;

  /**
   * Register a function that will be called when app close
   */
  beforeClose(fn: () => void): void;

  /**
   * Execute scope after loaded and before app start
   */
  beforeStart(scope: () => void): void;

  /**
   * Alias to {@link https://npmjs.com/package/depd}
   * @member {Function}
   * @since 1.0.0
   */
  deprecate: depd.Deprecate;

  Controller: typeof BaseContextClass;
  Service: typeof BaseContextClass;
}

/**
 * egg app info
 * @example
 * ```js
 * // config/config.default.ts
 * import { EggAppInfo } from 'egg';
 *
 * export default (appInfo: EggAppInfo) => {
 *   return {
 *     keys: appInfo.name + '123456',
 *   };
 * }
 * ```
 */
export interface EggAppInfo {
  pkg: any; // package.json
  name: string; // the application name from package.json
  baseDir: string; // current directory of application
  env: string; // equals to serverEnv
  HOME: string; // home directory of the OS
  root: string; // baseDir when local and unittest, HOME when other environment
}

/**
 * BaseContextClass is a base class that can be extended,
 * it's instantiated in context level,
 * {@link Helper}, {@link Service} is extending it.
 */
export class BaseContextClass<
  Context = any,
  Application = any,
  EggAppConfig = any,
  Service = any
> {
  constructor(ctx: Context);

  /**
   * request context
   */
  protected ctx: Context;

  /**
   * Application
   */
  protected app: Application;

  /**
   * Application config object
   */
  protected config: EggAppConfig;

  /**
   * service
   */
  protected service: Service;

  constructor(ctx: Context);
}

export interface FileLoaderOption {
  directory: string | string[]; // directories to be loaded
  target: object; // attach the target object from loaded files
  match?: string | string[]; // match the files when load, support glob, default to all js files
  ignore?: string | string[]; // ignore the files when load, support glob
  initializer?(obj: object, options: { path: string; pathName: string; }): any; // custom file exports, receive two parameters, first is the inject object(if not js file, will be content buffer), second is an `options` object that contain `path`
  call?: boolean; // determine whether invoke when exports is function
  override?: boolean; // determine whether override the property when get the same name
  inject?: object; // an object that be the argument when invoke the function
  filter?(obj: object): boolean; // a function that filter the exports which can be loaded
  caseStyle?: string | ((str: string) => string);// set property's case when converting a filepath to property list.
}

export interface ContextLoaderOption extends Partial<FileLoaderOption> {
  directory: string | string[]; // directories to be loaded
  inject: object; // required inject
  property: string; // property name defined to target
  fieldClass?: string; // determine the field name of inject object.
}

declare class FileLoader {
  /**
   * Load files from directory to target object.
   * @since 1.0.0
   */
  constructor(options: FileLoaderOption);

  /**
   * attach items to target object. Mapping the directory to properties.
   * `app/controller/group/repository.js` => `target.group.repository`
   * @return {Object} target
   * @since 1.0.0
   */
  load(): object;

  /**
   * Parse files from given directories, then return an items list, each item contains properties and exports.
   *
   * For example, parse `app/controller/group/repository.js`
   *
   * ```
   * module.exports = app => {
   *   return class RepositoryController extends app.Controller {};
   * }
   * ```
   *
   * It returns a item
   *
   * ```
   * {
   *   properties: [ 'group', 'repository' ],
   *   exports: app => { ... },
   * }
   * ```
   *
   * `Properties` is an array that contains the directory of a filepath.
   *
   * `Exports` depends on type, if exports is a function, it will be called. if initializer is specified, it will be called with exports for customizing.
   * @return {Array} items
   * @since 1.0.0
   */
  parse(): Array<{ fullpath: string; properties: string[]; exports: any; }>;
}

declare class ContextLoader extends FileLoader {
  /**
   * Same as {@link FileLoader}, but it will attach file to `inject[fieldClass]`. The exports will be lazy loaded, such as `ctx.group.repository`.
   * @extends FileLoader
   * @since 1.0.0
   */
  constructor(options: ContextLoaderOption);
}

export class EggLoader<T = EggCore, Config = any> {
  app: T;
  eggPaths: string[];
  pkg: PlainObject;
  appInfo: EggAppInfo;
  serverScope: string;
  plugins: Plugins;
  config: Config;

  /**
   * @constructor
   * @param {Object} options - options
   * @param {String} options.baseDir - the directory of application
   * @param {EggCore} options.app - Application instance
   * @param {Logger} options.logger - logger
   * @param {Object} [options.plugins] - custom plugins
   * @since 1.0.0
   */
  constructor(options: EggLoaderOptions);

  /**
   * Get home directory
   * @return {String} home directory
   * @since 3.4.0
   */
  getHomedir(): EggAppInfo['HOME'];

  /**
   * Get app info
   * @return {AppInfo} appInfo
   * @since 1.0.0
   */
  getAppInfo(): EggAppInfo;

  // Low Level API

  /**
   * Load single file, will invoke when export is function
   *
   * @param {String} filepath - fullpath
   * @param {Array} arguments - pass rest arguments into the function when invoke
   * @return {Object} exports
   * @example
   * ```js
   * app.loader.loadFile(path.join(app.options.baseDir, 'config/router.js'));
   * ```
   * @since 1.0.0
   */
  loadFile<T = any>(filepath: string, ...inject: any[]): any;

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
  getLoadUnits(): Array<{ path: string; type: string; }>;

  /**
   * Load files using {@link FileLoader}, inject to {@link Application}
   * @param {String|Array} directory - see {@link FileLoader}
   * @param {String} property - see {@link FileLoader}
   * @param {Object} opt - see {@link FileLoader}
   * @since 1.0.0
   */
  loadToApp(directory: string | string[], property: string, opt?: Partial<FileLoaderOption>): void;

  /**
   * Load files using {@link ContextLoader}
   * @param {String|Array} directory - see {@link ContextLoader}
   * @param {String} property - see {@link ContextLoader}
   * @param {Object} opt - see {@link ContextLoader}
   * @since 1.0.0
   */
  loadToContext(directory: string | string[], property: string, opt?: Partial<ContextLoaderOption>): void;

  getTypeFiles(filename: string): string[];
  resolveModule(filepath: string): string | undefined;

  FileLoader: typeof FileLoader;
  ContextLoader: typeof ContextLoader;

  // load methods
  protected loadConfig(): void;
  protected loadController(opt?: FileLoader): void;
  protected loadCustomLoader(): void;
  protected loadCustomApp(): void;
  protected loadCustomAgent(): void;
  protected loadAgentExtend(): void;
  protected loadApplicationExtend(): void;
  protected loadRequestExtend(): void;
  protected loadResponseExtend(): void;
  protected loadContextExtend(): void;
  protected loadHelperExtend(): void;
  protected loadMiddleware(opt?: FileLoader): void;
  protected loadPlugin(): void;
  protected loadRouter(): void;
  protected loadService(opt?: ContextLoader): void;
}
