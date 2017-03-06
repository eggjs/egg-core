'use strict';

const debug = require('debug')('egg-core:config');
const fs = require('fs');
const path = require('path');
const extend = require('extend2');
const assert = require('assert');


module.exports = {

  /**
   * Load config/config.js
   *
   * Will merge config.default.js 和 config.${env}.js
   *
   * @method EggLoader#loadConfig
   * @since 1.0.0
   */
  loadConfig() {
    const target = {};

    const names = [
      'config.default.js',
      `config.${this.serverEnv}.js`,
    ];

    // Load Application config first
    const appConfig = this._preloadAppConfig();

    //   plugin config.default
    //     framework config.default
    //       app config.default
    //         plugin config.{env}
    //           framework config.{env}
    //             app config.{env}
    for (const filename of names) {
      for (const unit of this.getLoadUnits()) {
        const isApp = unit.type === 'app';
        const config = this._loadConfig(unit.path, filename, isApp ? undefined : appConfig, unit.type);

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
      const config = this._loadConfig(this.options.baseDir, filename, undefined, 'app');
      extend(true, target, config);
    }
    return target;
  },

  _loadConfig(dirpath, filename, extraInject, type) {
    const isPlugin = type === 'plugin';
    const isApp = type === 'app';

    let filepath = path.join(dirpath, 'config', filename);
    // let config.js compatible
    if (filename === 'config.default.js' && !fs.existsSync(filepath)) {
      filepath = path.join(dirpath, 'config/config.js');
    }
    const config = this.loadFile(filepath, this.appInfo, extraInject);

    if (!config) {
      return null;
    }

    if (isPlugin || isApp) {
      assert(!config.coreMiddleware, 'Can not define coreMiddleware in app or plugin');
    }
    if (!isApp) {
      assert(!config.middleware, 'Can not define middleware in ' + filepath);
    }

    return config;
  },

};
