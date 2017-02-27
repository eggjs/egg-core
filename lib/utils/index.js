'use strict';

const co = require('co');
const homedir = require('node-homedir');
const is = require('is-type-of');


module.exports = {

  loadFile(filepath) {
    try {
      const obj = require(filepath);
      if (!obj) return obj;
      // it's es module
      if (obj.__esModule) return 'default' in obj ? obj.default : obj;
      return obj;
    } catch (err) {
      err.message = '[egg-core] load file: ' + filepath + ', error: ' + err.message;
      throw err;
    }
  },

  existsModule(filepath) {
    try {
      require.resolve(filepath);
      return true;
    } catch (e) {
      return false;
    }
  },

  getHomedir() {
    // EGG_HOME for test
    return process.env.EGG_HOME || homedir() || '/home/admin';
  },

  methods: [ 'head', 'options', 'get', 'put', 'patch', 'post', 'delete' ],

  * callFn(fn, args) {
    args = args || [];
    if (!is.function(fn)) return;
    if (is.generatorFunction(fn)) {
      return yield fn(...args);
    }
    const r = fn(...args);
    if (is.promise(r)) {
      return yield r;
    }
    return r;
  },

  middleware(fn) {
    if (is.generatorFunction(fn)) return fn;

    // support async function
    return function* (next) {
      // next is a generator
      yield module.exports.callFn(fn, [ this, () => co(next) ]);
    };
  },
};
