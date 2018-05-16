'use strict';

const assert = require('assert');

module.exports = app => {
  return class AsyncChecker extends app.Checker {
    async check() {
      assert.strictEqual(this.app.name, 'checker-app');
      this.app.readyQueue.push('class_async_function_checker');
    }
  }
};
