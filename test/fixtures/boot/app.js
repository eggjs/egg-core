'use strict';

const { sleep } = require('../../utils');

module.exports = class {
  constructor(app) {
    app.bootLog = [];
    this.app = app;
  }

  configWillLoad() {
    this.app.config.appSet = true;
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
