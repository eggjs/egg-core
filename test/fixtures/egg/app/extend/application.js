'use strict';

const symbol = require('../../../../utils').symbol;

module.exports = {
  get Proxy() {
    return this.BaseContextClass;
  },
  get [symbol.view]() {
    return 'egg';
  },
};
