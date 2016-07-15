'use strict';

const path = require('path');
const loading = require('loading');
const utils = require('./utils');
const classLoader = Symbol('classLoader');

module.exports = {

  /**
   * 加载 app/service 目录下的文件
   *
   * 1. 加载应用 app/service
   * 2. 加载插件 app/service
   *
   * @method EggLoader#loadService
   * @param {Object} opt - loading 参数
   */
  loadService(opt) {
    const app = this.app;
    opt = Object.assign({ call: false, lowercaseFirst: true }, opt);
    const servicePaths = this.loadDirs().map(dir => {
      const servicePath = path.join(dir, 'app/service');
      return servicePath;
    });

    // 载入到 app.serviceClasses
    delete app.serviceClasses;
    loading(servicePaths, opt).into(app, 'serviceClasses');

    /**
     * 可以访问到当前应用配置的所有 service，
     * service 目录约定在 `${baseDir}/app/service`。
     * @since 1.0.0
     * @member Context#service
     */
    Object.defineProperty(app.context, 'service', {
      get() {
        let loader = this[classLoader];
        if (!loader) {
          this[classLoader] = loader = new this.app.ServiceClassLoader(this);
        }
        return loader;
      },
    });

    // {
    //   key1: {
    //     subkey1: SubService1,
    //     subkey2: {
    //       subkey21: SubService21,
    //       subkey22: SubService22,
    //     },
    //     subkey3: SubService3,
    //   }
    // }
    app.ServiceClassLoader = utils.getClassLoader(app, 'service');
  },

};
