'use strict';

const path = require('path');
const EggCore = require('../../../..').EggCore;
const EggLoader = require('../../../..').EggLoader;

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

}

module.exports = EggApplication;
