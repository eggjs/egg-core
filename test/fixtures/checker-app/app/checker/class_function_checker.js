'use strict';

const assert = require('assert');

module.exports = app => {
  return class FuncChecker extends app.Checker {
    check() {
      assert.strictEqual(this.app.name, 'checker-app');
      this.app.readyQueue.push('class_function_checker');
    }
  }
};
