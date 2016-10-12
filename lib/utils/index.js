'use strict';

const interopRequire = require('interop-require');

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
    return process.env.HOME || '/home/admin';
  },

  methods: [ 'head', 'options', 'get', 'put', 'patch', 'post', 'delete' ],

};
