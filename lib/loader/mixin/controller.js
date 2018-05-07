'use strict';

const path = require('path');
const is = require('is-type-of');
const utility = require('utility');
const FULLPATH = require('../file_loader').FULLPATH;


module.exports = {

  /**
   * Load app/controller
   * @param {Object} opt - LoaderOptions
   * @since 1.0.0
   */
  loadController(opt) {
    this.timing.start('Load Controller');
    opt = Object.assign({
      caseStyle: 'lower',
      directory: path.join(this.options.baseDir, 'app/controller'),
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
          obj.prototype.fullPath = opt.path;
          return wrapClass(obj);
        }
        if (is.object(obj)) {
          return wrapObject(obj, opt.path);
        }
        if (is.generatorFunction(obj)) {
          return wrapObject({ 'module.exports': obj }, opt.path)['module.exports'];
        }
        return obj;
      },
    }, opt);
    const controllerBase = opt.directory;

    this.loadToApp(controllerBase, 'controller', opt);
    this.options.logger.info('[egg:loader] Controller loaded: %s', controllerBase);
    this.timing.end('Load Controller');
  },

};

// wrap the class, yield a object with middlewares
function wrapClass(Controller) {
  let proto = Controller.prototype;
  const ret = {};
  // tracing the prototype chain
  while (proto !== Object.prototype) {
    const keys = Object.getOwnPropertyNames(proto);
    for (const key of keys) {
      // getOwnPropertyNames will return constructor
      // that should be ignored
      if (key === 'constructor') {
        continue;
      }
      // skip getter, setter & non-function properties
      const d = Object.getOwnPropertyDescriptor(proto, key);
      // prevent to override sub method
      if (is.function(d.value) && !ret.hasOwnProperty(key)) {
        ret[key] = methodToMiddleware(Controller, key);
        ret[key][FULLPATH] = Controller.prototype.fullPath + '#' + Controller.name + '.' + key + '()';
      }
    }
    proto = Object.getPrototypeOf(proto);
  }
  return ret;

  function methodToMiddleware(Controller, key) {
    return function* classControllerMiddleware(...args) {
      const controller = new Controller(this);
      if (!this.app.config.controller || !this.app.config.controller.supportParams) {
        args = [ this ];
      }
      return yield callController(controller[key], controller, args);
    };
  }
}

// wrap the method of the object, method can receive ctx as it's first argument
function wrapObject(obj, path, prefix) {
  const keys = Object.keys(obj);
  const ret = {};
  for (const key of keys) {
    if (is.function(obj[key])) {
      const names = utility.getParamNames(obj[key]);
      if (names[0] === 'next') {
        throw new Error(`controller \`${prefix || ''}${key}\` should not use next as argument from file ${path}`);
      }
      ret[key] = functionToMiddleware(obj[key]);
      ret[key][FULLPATH] = `${path}#${prefix || ''}${key}()`;
    } else if (is.object(obj[key])) {
      ret[key] = wrapObject(obj[key], path, `${prefix || ''}${key}.`);
    }
  }
  return ret;

  function functionToMiddleware(func) {
    const objectControllerMiddleware = function* (...args) {
      if (!this.app.config.controller || !this.app.config.controller.supportParams) {
        args = [ this ];
      }
      return yield callController(func, this, args);
    };
    for (const key in func) {
      objectControllerMiddleware[key] = func[key];
    }
    return objectControllerMiddleware;
  }
}

function* callController(func, ctx, args) {
  const r = func.call(ctx, ...args);
  if (is.generator(r) || is.promise(r)) {
    return yield r;
  }
  return r;
}
