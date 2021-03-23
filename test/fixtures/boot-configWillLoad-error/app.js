'use strict';

module.exports = class {
  constructor(app) {
    app.bootLog = [];
    this.app = app;
  }

  configWillLoad() {
    throw new Error('configWillLoad error');
  }
};
