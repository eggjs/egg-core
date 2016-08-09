'use strict';

const path = require('path');

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
    const servicePaths = this.getLoadUnits().map(unit => {
      return path.join(unit.path, 'app/service');
    });

    // 载入到 app.serviceClasses
    opt = Object.assign({
      call: true,
      lowercaseFirst: true,
      fieldClass: 'serviceClasses',
    }, opt);
    this.loadToContext(servicePaths, 'service', opt);
  },

};
