'use strict';

const interopRequire = require('interop-require');
const homedir = require('node-homedir');

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

};
