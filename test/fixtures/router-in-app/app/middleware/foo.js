'use strict';

module.exports = () => {
  return function* (next) {
    this.foo = 'foo';
    yield next;
  };
};
