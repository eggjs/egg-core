'use strict';

const join = require('path').join;

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
    const arr = this.getLoadUnits().map(unit => join(unit.path, 'app/proxy'));

    opt = Object.assign({
      call: true,
      lowercaseFirst: true,
      fieldClass: 'proxyClasses',
    }, opt);
    this.loadToContext(arr, 'proxy', opt);

    this.options.logger.info('[egg:loader] Proxy loaded from %j', arr);
  },

};
