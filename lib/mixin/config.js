'use strict';

const debug = require('debug')('egg-loader:config');
const fs = require('fs');
const path = require('path');
const extend = require('extend');

module.exports = {

  /**
   * Load config/config.js
   *
   * Will merge config.default.js 和 config.${env}.js
   *
   * @method EggLoader#loadConfig
   */
  loadConfig() {
    const target = {};

    const names = [
      'config.default.js',
      `config.${this.serverEnv}.js`,
    ];

    // Load Application config first
    const appConfig = this._preloadAppConfig();

    // egg config.default
    //   plugin config.default
    //     framework config.default
    //       egg config.{env}
    //         plugin config.{env}
    //           framework config.{env}
    for (const filename of names) {
      for (const unit of this.getLoadUnits()) {
        const config = this._loadConfig(unit.path, filename, appConfig);

        if (!config) {
          continue;
        }

        debug('Loaded config %s/%s, %j', unit.path, filename, config);
        extend(true, target, config);
      }
    }

    // You can manipulate the order of app.config.coreMiddleware and app.config.appMiddleware in app.js
    target.coreMiddleware = target.coreMiddlewares = target.coreMiddleware || [];
    target.appMiddleware = target.appMiddlewares = target.middleware || [];

    this.config = target;
  },

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
    // let config.js compatible
    if (filename === 'config.default.js' && !fs.existsSync(filepath)) {
      filepath = path.join(dirpath, 'config/config.js');
    }
    const config = this.loadFile(filepath, this.appInfo, extraInject);

    if (!config) {
      return null;
    }

    // delete coreMiddleware when app and plugin
    if (isPlugin || isApp) {
      delete config.coreMiddleware;
    }
    // delete middleware and proxy when it's not app
    if (!isApp) {
      delete config.middleware;
      delete config.proxy;
    }

    return config;
  },

};
