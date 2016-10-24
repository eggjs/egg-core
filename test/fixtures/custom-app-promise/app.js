'use strict';

const co = require('co');

module.exports = co.wrap(function*(app) {
  yield wait(1000);
  app.app = true;
});

function wait(timeout) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}
