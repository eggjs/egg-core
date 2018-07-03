'use strict';

const fs = require('fs');
const path = require('path');
const rimraf = require('mz-modules/rimraf');

const eggPath = path.join(__dirname, 'node_modules/egg-core');
rimraf.sync(eggPath);
fs.symlinkSync(
  path.join(__dirname, '../../..'),
  eggPath,
  'dir'
);

const EggCore = require('egg-core').EggCore;
const EggLoader = require('egg-core').EggLoader;

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
    this.app[Symbol.for('EggCore#startBoot')]();
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

module.exports.Application = EggApplication;
