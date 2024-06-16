import { symbol } from '../../../../helper.js';

export default {
  get Proxy() {
    return this.BaseContextClass;
  },
  get [symbol.view]() {
    return 'egg';
  },
};
