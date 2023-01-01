const { sleep } = require('../../utils');

module.exports = class {
  constructor(app) {
    app.bootLog = [];
    this.app = app;
  }

  configDidLoad() {
    throw new Error('configDidLoad error');
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
};
