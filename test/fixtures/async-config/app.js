'use strict';

module.exports = class AppBoot {
  constructor(app) {
    this.app = app;
  }

  async configWillLoad() {
    this.app.config.list.push(1);
    await new Promise(resolve => setTimeout(resolve, 100));
    this.app.config.list.push(2);
  }

  async configDidLoad() {
    this.app.config.list.push(3);
    await new Promise(resolve => setTimeout(resolve, 100));
    this.app.config.list.push(4);
  }

  async didLoad() {
    this.app.config.list.push(5);
    await new Promise(resolve => setTimeout(resolve, 100));
    this.app.config.list.push(6);
  }
}