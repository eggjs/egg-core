'use strict';

module.exports = function() {
  return function*(next) {
    yield next;
    this.body.push('generator');
  };
};
