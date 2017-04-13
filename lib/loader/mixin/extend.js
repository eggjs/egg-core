'use strict';

const debug = require('debug')('egg-core:extend');
const path = require('path');
const utils = require('../../utils');

const orginalPrototypes = {
  request: require('koa/lib/request'),
  response: require('koa/lib/response'),
  context: require('koa/lib/context'),
  application: require('koa/lib/application'),
};

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
    const filepaths = this.getLoadUnits().map(unit => path.join(unit.path, 'app/extend', name));
    for (let i = 0, l = filepaths.length; i < l; i++) {
      const filepath = filepaths[i];
      filepaths.push(filepath + `.${this.serverEnv}`);
    }


    const mergeRecord = new Map();
    for (const filepath of filepaths) {
      if (!utils.existsModule(filepath)) {
        continue;
      }

      const ext = utils.loadFile(filepath);

      const properties = Object.getOwnPropertyNames(ext)
        .concat(Object.getOwnPropertySymbols(ext));

      for (const property of properties) {
        if (mergeRecord.has(property)) {
          debug('Property: "%s" already exists in "%s"，it will be redefined by "%s"',
            property, mergeRecord.get(property), filepath);
        }

        // Copy descriptor
        let descriptor = Object.getOwnPropertyDescriptor(ext, property);
        let orginalDescriptor = Object.getOwnPropertyDescriptor(proto, property);
        if (!orginalDescriptor) {
          // try to get descriptor from orginalPrototypes
          const orginalProto = orginalPrototypes[name];
          if (orginalProto) {
            orginalDescriptor = Object.getOwnPropertyDescriptor(orginalProto, property);
          }
        }
        if (orginalDescriptor) {
          // don't override descriptor
          descriptor = Object.assign({}, descriptor);
          if (!descriptor.set && orginalDescriptor.set) {
            descriptor.set = orginalDescriptor.set;
          }
          if (!descriptor.get && orginalDescriptor.get) {
            descriptor.get = orginalDescriptor.get;
          }
        }
        Object.defineProperty(proto, property, descriptor);
        mergeRecord.set(property, filepath);
      }
      debug('merge %j to %s from %s', Object.keys(ext), name, filepath);
    }
  },
};
