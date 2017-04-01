'use strict';

module.exports = function() {
  return function*(next) {
    this.body = [];
    this.body.push('generator before');
    yield next;
    this.body.push('generator after');
  };
};
