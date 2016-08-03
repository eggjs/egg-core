'use strict';

const is = require('is-type-of');
const deprecate = require('depd')('egg-loader');
const interopRequire = require('interop-require');
const createClassLoader = require('./class_loader');

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

  // 遍历
  walk(app, classes, fn, path) {
    path = path || [];
    Object.keys(classes).forEach(key => {
      let target = classes[key];
      const keys = [].concat(path, key);

      if (target === undefined || target === null) {
        return undefined;
      }

      // module.exports = class xxService extends Service {}
      if (is.class(target)) {
        return fn(target, keys);
      }

      // 兼容模式: module.exports = function*() {}
      if (is.generatorFunction(target)) {
        return fn(target, keys);
      }

      // 兼容模式: module.exports = function (app) {}
      if (typeof target === 'function') {
        // 自动调用一次
        target = target(app);
        return fn(target, keys);
      }

      // 判断是否是 exports.get = function* () {} 结构
      let hasGenerator = false;
      for (const fnName in target) {
        if (is.generatorFunction(target[fnName])) {
          hasGenerator = true;
          break;
        }
      }

      if (hasGenerator) {
        return fn(target, keys);
      }

      return module.exports.walk(app, target, fn, keys);
    });
  },

  /**
   * 获取对应的 classloader
   * @param {Object} app - app对象
   * @param {String} type - 要加载的类型, proxy / service
   * @return {Function} 返回对应的 classloader
   */
  getClassLoader(app, type) {
    const targetClasses = app[type + 'Classes'];
    const subClasses = {};

    // hook to subServiceClasses / subProxyClasses, will be used in mm.mockService
    const subClassesName = 'sub' + type[0].toUpperCase() + type.substring(1) + 'Classes';
    app[subClassesName] = subClasses;

    exports.walk(app, targetClasses, (target, keys) => {
      const first = keys[0];
      if (keys.length === 1) {
        targetClasses[first] = target;
        return;
      }

      if (keys.length > 3) {
        deprecate(`不再支持超过 2 级子目录的 ${type} 加载，最长只到 ${first}.${keys[1]}.${keys[2]}`);
        return;
      }

      // 有两层或者三层的情况
      delete targetClasses[first];

      // 最后一层的值是target
      const last = keys.pop();

      // keys为对象路径，首先依次查看subClasses下是否有，如果没有赋值空对象
      let classes = subClasses;
      for (const key of keys) {
        if (!classes[key]) {
          classes[key] = {};
        }
        classes = classes[key];
      }

      classes[last] = target;
    });

    return createClassLoader(targetClasses, subClasses);
  },

};
