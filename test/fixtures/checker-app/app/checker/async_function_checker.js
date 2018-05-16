'use strict';

const assert = require('assert');

module.exports = function(app) {
  return async function() {
    assert.strictEqual(app.name, 'checker-app');
    app.readyQueue.push('async_function_checker');
  };
};
