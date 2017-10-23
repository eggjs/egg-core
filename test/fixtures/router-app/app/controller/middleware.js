'use strict';

module.exports = function* () {
  this.body = [];
};

module.exports.index = function* (next) {
  this.body = [];
  yield next;
};
