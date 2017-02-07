'use strict';

const co = require('co');
const path = require('path');
const interopRequire = require('interop-require');
const homedir = require('node-homedir');
const is = require('is-type-of');


module.exports = {

  loadFile(filepath) {
    let exports;
    try {
      exports = interopRequire(filepath);
    } catch (err) {
      err.message = 'load file: ' + filepath + ', error: ' + err.message;
      throw err;
    }
    return exports;
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

  // rename fullpath
  // /path/to/app/controller/admin/config.js => controller.admin.config
  getPathName(fullpath, app) {
    const baseDir = app.loader.appInfo.baseDir;
    return fullpath
      .replace(path.join(baseDir, 'app/'), '')
      .replace(/\/|\\/g, '.')
      .replace(/\.js$/, '');
  },

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
