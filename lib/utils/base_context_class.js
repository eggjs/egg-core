'use strict';

class BaseContextClass {
  constructor(ctx) {
    this.ctx = ctx;
    this.app = ctx.app;
  }
}

module.exports = BaseContextClass;
