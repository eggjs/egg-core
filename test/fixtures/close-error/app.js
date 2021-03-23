'use strict';

module.exports = class {
  async beforeClose() {
    throw new Error('close error');
  }
};
