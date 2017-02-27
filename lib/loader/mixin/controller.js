'use strict';

const path = require('path');
const is = require('is-type-of');
const utility = require('utility');

module.exports = {

  /**
   * Load app/controller
   * @param {Object} opt - LoaderOptions
   * @since 1.0.0
   */
  loadController(opt) {
    opt = Object.assign({
      caseStyle: 'lower',
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
        if (is.promise(obj)) {
          // module.exports = async ctx => ctx.body = 'hello';
          const displayPath = path.relative(this.app.baseDir, opt.path);
          throw new Error(`${displayPath} cannot be async function`);
        }
        if (is.class(obj)) {
          obj.prototype.pathName = opt.pathName;
          return wrapClass(obj);
        }
        if (is.object(obj)) {
          return wrapObject(obj, opt.path);
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
    return function* classControllerMiddleware() {
      const controller = new Controller(this);
      const r = controller[key](this);
      // TODO: if we can check async function, then we can check it out of the middleware
      if (is.generator(r) || is.promise(r)) {
        yield r;
      }
    };
  }
}

// wrap the method of the object, method can recieve ctx as it's first argument
function wrapObject(obj, path) {
  const keys = Object.keys(obj);
  const ret = {};
  for (const key of keys) {
    if (is.function(obj[key])) {
      const names = utility.getParamNames(obj[key]);
      if (names[0] === 'next') {
        throw new Error(`controller \`${key}\` should not use next as argument from file ${path}`);
      }
      ret[key] = functionToMiddleware(obj[key]);
    }
  }
  return ret;

  function functionToMiddleware(func) {
    return function* objectControllerMiddleware() {
      const r = func.call(this, this);
      if (is.generator(r) || is.promise(r)) {
        yield r;
      }
    };
  }
}
