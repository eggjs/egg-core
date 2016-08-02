'use strict';

const path = require('path');
const KoaApplication = require('koa');

class EggApplication extends KoaApplication {
  get [Symbol.for('egg#eggPath')]() {
    return __dirname;
  }
}

module.exports = EggApplication;
