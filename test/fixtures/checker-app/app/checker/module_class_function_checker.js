'use strict';

const assert = require('assert');

module.exports = class AsyncChecker {
  constructor(app) {
    this.app = app;
  }

  async check() {
    assert.strictEqual(this.app.name, 'checker-app');
    this.app.readyQueue.push('module_class_function_checker');
  }
};
