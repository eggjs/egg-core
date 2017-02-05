'use strict';

class BaseContextClass {
  constructor(ctx) {
    this.ctx = ctx;
    this.app = ctx.app;
    this.config = ctx.app.config;
  }
}

module.exports = BaseContextClass;
