'use strict';

const EggApplication = require('../egg');

class Application extends EggApplication {
  [Symbol.for('egg#eggPath')]() {
    return __dirname;
  }
}

module.exports = Application;
