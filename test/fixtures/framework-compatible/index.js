'use strict';

const path = require('path');
const EggApplication = require('../egg').Application;

class Framework2 extends EggApplication {

  get[Symbol.for('egg#eggPath')]() {
    return path.join(__dirname, 'lib/core');
  }
}

module.exports = Framework2;
