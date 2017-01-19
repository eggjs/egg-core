'use strict';

const path = require('path');
const is = require('is-type-of');
const utils = require('../../utils');

module.exports = {

  /**
   * Load app/controller
   * @param {Object} opt - LoaderOptions
   * @since 1.0.0
   */
  loadController(opt) {
    opt = Object.assign({
      lowercaseFirst: true,
      initializer: (obj, opt) => {
        // return class if it exports a function
        // ```js
        // module.exports = app => {
        //   return class HomeController extends app.Controller {};
        // }
        // ```
        if (is.function(obj) && !is.generatorFunction(obj) && !is.class(obj)) {
          obj = obj(this.app);
        }
        if (is.class(obj)) {
          obj.prototype.pathName = utils.getPathName(opt.path, this.app);
          return wrapClass(obj);
        }
        if (is.object(obj)) {
          return wrapObject(obj);
        }
        return obj;
      },
    }, opt);
    const controllerBase = path.join(this.options.baseDir, 'app/controller');

    this.loadToApp(controllerBase, 'controller', opt);
    this.options.logger.info('[egg:loader] Controller loaded: %s', controllerBase);
  },

};

// wrap the class, yield a object with middlewares
function wrapClass(Controller) {
  const keys = Object.getOwnPropertyNames(Controller.prototype);
  const ret = {};
  for (const key of keys) {
    // getOwnPropertyNames will return constructor
    // that should be ignored
    if (key === 'constructor') {
      continue;
    }
    if (is.function(Controller.prototype[key])) {
      ret[key] = methodToMiddleware(Controller, key);
    }
  }
  return ret;

  function methodToMiddleware(Controller, key) {
    return function* controllerMiddleware() {
      const controller = new Controller(this);
      const r = controller[key](this);
      if (is.generator(r) || is.promise(r)) {
        yield r;
      }
    };
  }
}

// wrap the method of the object, method can recieve ctx as it's first argument
function wrapObject(obj) {
  const keys = Object.keys(obj);
  const ret = {};
  for (const key of keys) {
    if (is.function(obj[key])) {
      ret[key] = functionToMiddleware(obj[key]);
    }
  }
  return ret;

  function functionToMiddleware(func) {
    return function* controllerMiddleware() {
      const r = func.call(this, this);
      if (is.generator(r) || is.promise(r)) {
        yield r;
      }
    };
  }
}
