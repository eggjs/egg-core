'use strict';

const sleep = require('mz-modules/sleep');

module.exports = class {
  constructor(app) {
    this.app = app;
    app.bootLog = [];
  }

  configDidLoad() {
    this.app.bootLog.push('configDidLoad in app');
  }

  async didLoad() {
    await sleep(1);
    this.app.bootLog.push('didLoad');
  }

  async willReady() {
    await sleep(1);
    this.app.bootLog.push('willReady');
  }

  async didReady() {
    await sleep(1);
    this.app.bootLog.push('didReady');
  }

  async beforeClose() {
    await sleep(1);
    this.app.bootLog.push('beforeClose');
  }

  async serverDidReady() {
    await sleep(1);
    this.app.bootLog.push('serverDidReady');
  }
};
