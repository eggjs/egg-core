'use strict';

const is = require('is-type-of');

module.exports = function createClassLoader(classes, subClasses) {
  class ClassLoader {
    constructor(ctx) {
      this.ctx = ctx;
      this._cache = new Map();
    }

    _getInstance(classname) {
      let instance = this._cache.get(classname);
      if (!instance) {
        const Class = classes[classname];
        if (typeof Class === 'function' && !is.generatorFunction(Class)) {
          // module.exports = class SubService extends Serivce
          instance = new Class(this.ctx);
        } else {
          // 兼容模式
          // module.exports = { ... }
          instance = Class;
        }
        this._cache.set(classname, instance);
      }
      return instance;
    }

    // 支持子节点类加载，目前只支持最多2级节点
    // 只能一次性将此节点下的类都实例化出来
    _getSubClassInstance(rootName) {
      let obj = this._cache.get(rootName);
      if (obj) {
        return obj;
      }
      obj = {};
      const map = subClasses[rootName];
      for (const sub1 in map) {
        const Class = map[sub1];
        if (typeof Class === 'function') {
          obj[sub1] = new Class(this.ctx);
        } else {
          for (const sub2 in Class) {
            const Class2 = Class[sub2];
            if (!obj[sub1]) {
              obj[sub1] = {};
            }
            obj[sub1][sub2] = new Class2(this.ctx);
          }
        }
      }
      this._cache.set(rootName, obj);
      return obj;
    }
  }

  Object.keys(classes).forEach(function(classname) {
    Object.defineProperty(ClassLoader.prototype, classname, {
      get() {
        return this._getInstance(classname);
      },
    });
  });

  if (subClasses) {
    Object.keys(subClasses).forEach(function(rootName) {
      Object.defineProperty(ClassLoader.prototype, rootName, {
        get() {
          return this._getSubClassInstance(rootName);
        },
      });
    });
  }

  return ClassLoader;
};
