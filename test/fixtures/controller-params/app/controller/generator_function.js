'use strict';

module.exports = function* (...args) {
  this.body = 'done';
  return args;
};
