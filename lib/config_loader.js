'use strict';

const debug = require('debug')('egg:loader:config');
const fs = require('fs');
const path = require('path');
const extend = require('extend');
const getHomedir = require('./utils').getHomedir;

module.exports = {

  /**
   * config/config.js 加载类，封装加载逻辑，
   *
   * 加载时会合并 config.default.js 和 config.${env}.js
   *
   * config.middleware 和 config.proxy 的配置会被剔除
   *
   * 可加载路径查看 {@link EggLoader#loadDirs}
   * @method EggLoader#loadConfig
   */
  loadConfig() {
    const target = {};

    const names = [
      'config.default.js',
      `config.${this.serverEnv}.js`,
    ];

    // 先加载一次应用配置，传给框架和插件的配置
    const appConfig = this._preloadAppConfig();

    // egg config.default
    //   plugin config.default
    //     framework config.default
    //       egg config.{env}
    //         plugin config.{env}
    //          framework config.{env}
    for (const filename of names) {
      for (const dirpath of this.loadDirs()) {
        const config = this._loadConfig(dirpath, filename, appConfig);

        if (!config) {
          continue;
        }

        debug('Loaded config %s/%s, %j', dirpath, filename, config);
        extend(true, target, config);
      }
    }

    // 可以在 app.js 中操作 app.config.coreMiddleware 和 app.config.appMiddleware;
    target.coreMiddleware = target.coreMiddlewares = target.coreMiddleware || [];
    // 记录应用自定义中间件，后续可以根据此配置让插件在将中间件放在应用自定义中间件之前
    target.appMiddleware = target.appMiddlewares = target.middleware || [];

    /**
     * 获取 `{baseDir}/config/config.{env}.js` 下的配置。
     * 包含以下配置:
     *
     * * `baseDir`: 应用文件基础目录, 如 `/home/admin/demoapp`
     * * `pkg`: [package.json] 配置
     */
    this.config = target;
  },

  // 提前加载应用配置，可以传给其他配置
  _preloadAppConfig() {
    const names = [
      'config.default.js',
      `config.${this.serverEnv}.js`,
    ];
    const target = {};
    for (const filename of names) {
      const config = this._loadConfig(this.options.baseDir, filename);
      extend(true, target, config);
    }
    return target;
  },

  _loadConfig(dirpath, filename, extraInject) {
    const pluginPaths = this.orderPlugins ? this.orderPlugins.map(plugin => plugin.path) : [];
    const isPlugin = pluginPaths.indexOf(dirpath) > -1;
    const isApp = dirpath === this.options.baseDir;

    let filepath = path.join(dirpath, 'config', filename);
    // 兼容 config.js，config.js 和 config.default 是平级的
    if (filename === 'config.default.js' && !fs.existsSync(filepath)) {
      filepath = path.join(dirpath, 'config/config.js');
    }
    const name = this.getAppname();
    const config = this.loadFile(filepath, {
      name,
      baseDir: this.options.baseDir,
      env: this.serverEnv,
      HOME: getHomedir(),
      pkg: this.pkg,
    }, extraInject);

    if (!config) {
      return null;
    }

    // 插件和应用不允许配置 coreMiddleware
    if (isPlugin || isApp) {
      delete config.coreMiddleware;
    }
    // 框架和插件不运行配置 middleware 和 proxy 的属性，避免覆盖应用的
    if (!isApp) {
      delete config.middleware;
      delete config.proxy;
    }

    return config;
  },

};
