'use strict';

const join = require('path').join;
const is = require('is-type-of');
const debug = require('debug')('egg-core:middleware');
const inspect = require('util').inspect;
const pathMatching = require('egg-path-matching');

module.exports = {

  /**
   * Load app/middleware
   *
   * app.config.xx is the options of the middleware xx that has same name as config
   *
   * @method EggLoader#loadMiddleware
   * @param {Object} opt - LoaderOptions
   * @example
   * ```js
   * // app/middleware/status.js
   * module.exports = function(options, app) {
   *   // options == app.config.status
   *   return function*(next) {
   *     yield next;
   *   }
   * }
   * ```
   * @since 1.0.0
   */
  loadMiddleware(opt) {
    const app = this.app;

    // load middleware to app.middleware
    opt = Object.assign({
      call: false,
      override: true,
      lowercaseFirst: true,
    }, opt);
    const middlewarePaths = this.getLoadUnits().map(unit => join(unit.path, 'app/middleware'));
    this.loadToApp(middlewarePaths, 'middlewares', opt);

    this.options.logger.info('Use coreMiddleware order: %j', this.config.coreMiddleware);
    this.options.logger.info('Use appMiddleware order: %j', this.config.appMiddleware);

    // use middleware ordered by app.config.coreMiddleware and app.config.appMiddleware
    const middlewareNames = this.config.coreMiddleware.concat(this.config.appMiddleware);
    debug('middlewareNames: %j', middlewareNames);
    const middlewaresMap = new Map();
    for (const name of middlewareNames) {
      if (!app.middlewares[name]) {
        throw new TypeError(`Middleware ${name} not found`);
      }
      if (middlewaresMap.has(name)) {
        throw new TypeError(`Middleware ${name} redefined`);
      }
      middlewaresMap.set(name, true);

      const options = this.config[name] || {};
      let mw = app.middlewares[name];
      mw = mw(options, app);
      if (!is.generatorFunction(mw)) {
        throw new TypeError(`Middleware ${name} must be a generator function, but actual is ${inspect(mw)}`);
      }
      mw._name = name;

      // core middleware support options.enable, options.ignore and options.match
      const isCoreMiddleware = this.config.coreMiddleware.indexOf(name) >= 0;
      if (isCoreMiddleware) {
        if (options.enable !== false) {
          app.use(wrapCoreMiddleware(mw, options));
          debug('Use core middleware: %s with options: %j', name, options);
        }
      } else {
        app.use(mw);
        debug('Use app middleware: %s with options: %j', name, options);
      }
      this.options.logger.info('[egg:loader] Use %s middleware: %s', isCoreMiddleware ? 'core' : 'app', name);
    }

    this.options.logger.info('[egg:loader] Loaded middleware from %j', middlewarePaths);
  },

};

function wrapCoreMiddleware(mw, options) {
  const match = pathMatching(options);
  const fn = function* (next) {
    if (!match(this)) return yield next;
    yield mw.call(this, next);
  };
  fn._name = mw._name + 'coreMiddlewareWrapper';
  return fn;
}
