'use strict';

const fs = require('fs');
const path = require('path');
const interopRequire = require('interop-require');
const debug = require('debug')('egg-loader:extend');
const utils = require('../../utils');

module.exports = {

  /**
   * mixin Agent.prototype
   * @method EggLoader#loadAgentExtend
   * @since 1.0.0
   */
  loadAgentExtend() {
    this.loadExtend('agent', this.app);
  },

  /**
   * mixin Application.prototype
   * @method EggLoader#loadApplicationExtend
   * @since 1.0.0
   */
  loadApplicationExtend() {
    this.loadExtend('application', this.app);
  },

  /**
   * mixin Request.prototype
   * @method EggLoader#loadRequestExtend
   * @since 1.0.0
   */
  loadRequestExtend() {
    this.loadExtend('request', this.app.request);
  },

  /**
   * mixin Response.prototype
   * @method EggLoader#loadResponseExtend
   * @since 1.0.0
   */
  loadResponseExtend() {
    this.loadExtend('response', this.app.response);
  },

  /**
   * mixin Context.prototype
   * @method EggLoader#loadContextExtend
   * @since 1.0.0
   */
  loadContextExtend() {
    this.loadExtend('context', this.app.context);
  },

  /**
   * mixin app.Helper.prototype
   * @method EggLoader#loadHelperExtend
   * @since 1.0.0
   */
  loadHelperExtend() {
    if (this.app && this.app.Helper) {
      this.loadExtend('helper', this.app.Helper.prototype);
    }
  },

  /**
   * Loader app/extend/xx.js to `prototype`,
   * @method loadExtend
   * @param {String} name - filename which may be `app/extend/{name}.js`
   * @param {Object} proto - prototype that mixed
   * @since 1.0.0
   */
  loadExtend(name, proto) {
    // 获取需要加载的文件
    const filepaths = this.getLoadUnits()
      .map(unit => {
        let pluginExtendsPath = path.join(unit.path, 'app/extend');
        if (!fs.existsSync(pluginExtendsPath)) {
          pluginExtendsPath = path.join(unit.path, 'app');
        }
        return path.join(pluginExtendsPath, name);
      });
    const mergeRecord = new Map();
    for (const filepath of filepaths) {
      if (!utils.existsModule(filepath)) {
        continue;
      }

      let ext;
      try {
        ext = interopRequire(filepath);
      } catch (err) {
        err.message = `[egg-loader] load file ${require.resolve(filepath)} error: ${err.message}`;
        throw err;
      }

      const names = Object.getOwnPropertyNames(ext)
        .concat(Object.getOwnPropertySymbols(ext));

      if (names.length === 0) {
        continue;
      }

      for (const name of names) {
        if (mergeRecord.has(name)) {
          debug('Property: "%s" already exists in "%s"，it will be redefined by "%s"',
            name, mergeRecord.get(name), filepath);
        }

        // Copy descriptor
        const descriptor = Object.getOwnPropertyDescriptor(ext, name);
        Object.defineProperty(proto, name, descriptor);
        mergeRecord.set(name, filepath);
      }
      debug('merge %j to %s from %s', Object.keys(ext), name, filepath);
    }

  },
};
