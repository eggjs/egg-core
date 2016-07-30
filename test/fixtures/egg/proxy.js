'use strict';

class Proxy {
  constructor(ctx) {
    this.ctx = ctx;
    this.app = ctx.app;
  }
}

module.exports = Proxy;
