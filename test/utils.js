'use strict';

const path = require('path');
const EggApplication = require('./fixtures/egg');

module.exports = {

  getFilepath(name) {
    return path.join(__dirname, 'fixtures', name);
  },

  createApp(name, options) {
    const baseDir = this.getFilepath(name);
    options = options || {};
    options.baseDir = baseDir;
    options.type = options.type || 'application';

    let CustomApplication = EggApplication;
    if (options.Application) {
      CustomApplication = options.Application;
    }

    return new CustomApplication(options);
  },

  symbol: {
    view: Symbol('view'),
  },

};
