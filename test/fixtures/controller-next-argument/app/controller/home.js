'use strict';

exports.next = function*(next) {
  yield next;
  this.body = 'done';
};
