'use strict';

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
  getPathName(path, app) {
    const baseDir = app.loader.appInfo.baseDir;
    return path
      .replace(`${baseDir}/app/`, '')
      .replace(/\//g, '.')
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
};
