'use strict';

const symbol = require('../../../../utils').symbol;

module.exports = {
  get [symbol.view]() {
    return 'view';
  },
};
