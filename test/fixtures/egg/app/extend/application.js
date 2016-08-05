'use strict';

const symbol = require('../../../../utils').symbol;

module.exports = {
  Proxy: require('../../proxy'),
  Service: require('../../service'),
  get [symbol.view]() {
    return 'egg';
  }
};
