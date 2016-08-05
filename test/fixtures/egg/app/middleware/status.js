'use strict';

module.exports = function() {
  return function*(next) {
    if (this.path === '/status') {
      this.body = 'egg status';
      return;
    }

    yield next;
  };
};
