'use strict';

const join = require('path').join;
const is = require('is-type-of');
const debug = require('debug')('egg:loader:middleware');
const inspect = require('util').inspect;

module.exports = {

  /**
   * Load middleware
   *
   * app.config.xx is the options of the middleware xx that has same name as config
   *
   * @method EggLoader#loadMiddleware
   * @param {Object} opt LoaderOptions
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
   */
  loadMiddleware(opt) {
    const app = this.app;

    // load middleware to app.middleware
    opt = Object.assign({
      call: false,
      override: true,
      lowercaseFirst: true,
    }, opt);
    const middlewarePaths = this.loadDirs().map(dir => join(dir, 'app/middleware'));
    this.loadToApp(middlewarePaths, 'middlewares', opt);

    app.coreLogger.info('Use coreMiddleware order: %j', this.config.coreMiddleware);
    app.coreLogger.info('Use appMiddleware order: %j', this.config.appMiddleware);

    // use middleware ordered by app.config.coreMiddleware and app.config.appMiddleware
    const middlewareNames = this.config.coreMiddleware.concat(this.config.appMiddleware);
    debug('middlewareNames: %j', middlewareNames);
    for (const name of middlewareNames) {
      if (!app.middlewares[name]) {
        throw new TypeError(`Middleware ${name} not found`);
      }

      const options = this.config[name] || {};
      let mw = app.middlewares[name];
      mw = mw(options, app);
      if (!is.generatorFunction(mw)) {
        throw new TypeError(`Middleware ${name} must be a generator function, but actual is ${inspect(mw)}`);
      }
      mw._name = name;
      app.use(mw);
      debug('Use middleware: %s with options: %j', name, options);
      app.coreLogger.info('[egg:loader] Use middleware: %s', name);
    }

    app.coreLogger.info('[egg:loader] Loaded middleware from %j', middlewarePaths);
  },

};
