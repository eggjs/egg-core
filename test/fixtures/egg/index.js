'use strict';

const path = require('path');
const EggCore = require('../../..').EggCore;
const EggLoader = require('../../..').EggLoader;

class AppLoader extends EggLoader {
  loadAll() {
    this.loadPlugin();
    this.loadConfig();
    this.loadApplicationExtend();
    this.loadContextExtend();
    this.loadRequestExtend();
    this.loadResponseExtend();
    this.loadCustomApp();
    this.loadMiddleware();
    this.loadService();
    this.loadController();
    this.loadRouter();
    this.loadChecker();
  }
}

class EggApplication extends EggCore {

  constructor(options) {
    super(options);
    this.on('error', err => {
      console.error(err);
    })
  }

  get [Symbol.for('egg#eggPath')]() {
    return __dirname;
  }
  get [Symbol.for('egg#loader')]() {
    return AppLoader;
  }
}

module.exports = EggApplication;
