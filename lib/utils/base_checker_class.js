'use strict';

const assert = require('assert');

class BaseCheckerClass {
  /**
   * @constructor
   * @param {Application} app - egg application
   * @since 4.8.0
   */
  constructor(app) {
    /**
     * @member {Application} BaseContextClass#app
     * @since 4.8.0
     */
    this.app = app;
  }

  /**
   * check app status before app ready callbacks called
   * @since 4.8.0
   */
  /* istanbul ignore next */
  check() {
    assert.fail('should implement in subclass');
  }
}

module.exports = BaseCheckerClass;
