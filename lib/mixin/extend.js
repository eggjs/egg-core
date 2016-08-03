'use strict';

const fs = require('fs');
const path = require('path');
const interopRequire = require('interop-require');
const debug = require('debug')('egg-loader:extend');
const utils = require('../utils');

module.exports = {

  /**
   * 扩展 Agent.prototype 的属性
   *
   * 可加载路径查看 {@link EggLoader#getLoadUnits}
   * @method EggLoader#loadAgentExtend
   */
  loadAgentExtend() {
    this.loadExtend('agent', this.app);
  },

  /**
   * 扩展 Application.prototype 的属性
   *
   * 可加载路径查看 {@link EggLoader#getLoadUnits}
   * @method EggLoader#loadApplicationExtend
   */
  loadApplicationExtend() {
    this.loadExtend('application', this.app);
  },

  /**
   * 扩展 Request.prototype 的属性
   *
   * 可加载路径查看 {@link EggLoader#getLoadUnits}
   * @method EggLoader#loadRequestExtend
   */
  loadRequestExtend() {
    this.loadExtend('request', this.app.request);
  },

  /**
   * 扩展 Response.prototype 的属性
   *
   * 可加载路径查看 {@link EggLoader#getLoadUnits}
   * @method EggLoader#loadResponseExtend
   */
  loadResponseExtend() {
    this.loadExtend('response', this.app.response);
  },

  /**
   * 扩展 Context.prototype 的属性
   *
   * 可加载路径查看 {@link EggLoader#getLoadUnits}
   * @method EggLoader#loadContextExtend
   */
  loadContextExtend() {
    this.loadExtend('context', this.app.context);
  },

  /**
   * 扩展 app.Helper.prototype 的属性
   *
   * 可加载路径查看 {@link EggLoader#getLoadUnits}
   * @method EggLoader#loadHelperExtend
   */
  loadHelperExtend() {
    if (this.app && this.app.Helper) {
      this.loadExtend('helper', this.app.Helper.prototype);
    }
  },

  /**
   * 加载 extend 基类
   *
   * @method loadExtend
   * @param {String} name - 加载的文件名，如 app/extend/{name}.js
   * @param {Object} proto - 最终将属性合并到 proto 上
   * @private
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
