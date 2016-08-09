'use strict';

const interopRequire = require('interop-require');

module.exports = exports = {

  /**
   * require a file
   * @param  {String} filepath fullpath
   * @return {Object} exports
   */
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

  /**
   * 判断模块是否存在
   * @method Util#existsModule
   * @param {String} path - 模块路径
   * @return {boolean} 如果模块存在则返回 `true`，否则返回 `false`。
   */
  existsModule(path) {
    try {
      require.resolve(path);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * 获得 Home 目录，将会从环境变量 `HOME` 里面获取，如果没有，会返回 "/home/admin"
   * @function getHomedir
   * @return {String} 用户目录
   */
  getHomedir() {
    return process.env.HOME || '/home/admin';
  },

  methods: [ 'head', 'options', 'get', 'put', 'patch', 'post', 'delete' ],

};
