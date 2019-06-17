'use strict';

const sleep = require('mz-modules/sleep');

module.exports = class TimeoutHook {
  async didLoad() {
    await sleep(10);
  }
};
