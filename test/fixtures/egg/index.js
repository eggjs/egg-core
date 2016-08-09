'use strict';

const path = require('path');
const EggCore = require('../../..').EggCore;
const EggLoader = require('../../..').EggLoader;

class EggApplication extends EggCore {
  get [Symbol.for('egg#eggPath')]() {
    return __dirname;
  }
  get [Symbol.for('egg#loader')]() {
    return EggLoader;
  }
}

module.exports = EggApplication;
