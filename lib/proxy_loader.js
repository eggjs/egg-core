'use strict';

const join = require('path').join;
const classLoader = Symbol('classLoader');
const utils = require('./utils');

module.exports = {

  /**
   * 加载 app/proxy 目录下的文件
   *
   * 1. 加载应用 app/proxy
   * 2. 加载插件 app/proxy
   *
   * @method EggLoader#loadProxy
   * @param {Object} opt - loading 参数
   */
  loadProxy(opt) {
    const app = this.app;
    opt = Object.assign({ call: true, lowercaseFirst: true }, opt);
    const arr = this.getLoadUnits().map(unit => join(unit.path, 'app/proxy'));
    // load proxy classes to app.proxyClasses
    this.loadToApp(arr, 'proxyClasses', opt);

    // this.proxy.demoQuery.getUser(uid)
    Object.defineProperty(app.context, 'proxy', {
      get() {
        let loader = this[classLoader];
        if (!loader) {
          this[classLoader] = loader = new this.app.ProxyClassLoader(this);
        }
        return loader;
      },
    });

    // {
    //   key1: {
    //     subkey1: SubProxy1,
    //     subkey2: {
    //       subkey21: SubProxy21,
    //       subkey22: SubProxy22,
    //     },
    //     subkey3: SubProxy3,
    //   }
    // }
    app.ProxyClassLoader = utils.getClassLoader(app, 'proxy');

    app.coreLogger.info('[egg:loader] Proxy loaded from %j', arr);
  },

};
