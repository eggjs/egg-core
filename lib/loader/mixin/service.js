'use strict';

const path = require('path');

module.exports = {

  /**
   * Load app/service
   * @method EggLoader#loadService
   * @param {Object} opt - LoaderOptions
   * @since 1.0.0
   */
  loadService(opt) {
    const servicePaths = this.getLoadUnits().map(unit => {
      return path.join(unit.path, 'app/service');
    });

    // 载入到 app.serviceClasses
    opt = Object.assign({
      call: true,
      caseStyle: 'lower',
      fieldClass: 'serviceClasses',
    }, opt);
    this.loadToContext(servicePaths, 'service', opt);
  },

};
