'use strict';

const path = require('path');

module.exports = {

  /**
   * load app/controller
   *
   * @param {Object} opt LoaderOptions
   */
  loadController(opt) {
    const app = this.app;
    opt = Object.assign({ lowercaseFirst: true }, opt);
    const controllerBase = path.join(this.options.baseDir, 'app/controller');

    this.loadToApp(controllerBase, 'controller', opt);
    app.coreLogger.info('[egg:loader] Controller loaded: %s', controllerBase);
  },

};
