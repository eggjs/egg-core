'use strict';

let index = 0;

module.exports = function () {
  return function* (next) {
    yield next;
    this.body.push(`generator middleware #${++index}`);
  };
};
