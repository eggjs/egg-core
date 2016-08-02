'use strict';

const KoaApplication = require('koa');

class Application extends KoaApplication {
  get [Symbol.for('egg#eggPath')]() {
    return __dirname;
  }
}

module.exports = Application;
