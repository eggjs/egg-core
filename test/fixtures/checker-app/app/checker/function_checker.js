'use strict';

const assert = require('assert');

module.exports = function(app) {
  return function() {
    assert.strictEqual(app.name, 'checker-app');
    app.readyQueue.push('function_checker');
  };
};
