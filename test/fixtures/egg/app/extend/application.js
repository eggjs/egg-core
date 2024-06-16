'use strict';

module.exports = {
  get Proxy() {
    return this.BaseContextClass;
  },
  get [Symbol('view')]() {
    return 'egg';
  },
};
