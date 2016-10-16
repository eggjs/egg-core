'use strict';

const co = require('co');

module.exports = co.wrap(function*(app) {
  yield wait(1000);
  throw new Error('load async error');
});

function wait(timeout) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}
