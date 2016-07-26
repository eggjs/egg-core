'use strict';

const join = require('path').join;
const is = require('is-type-of');
const debug = require('debug')('egg:loader:middleware');
const inspect = require('util').inspect;

module.exports = {
  /**
   * 加载中间件，将中间件加载到 app.middleware，并根据 config 配置载入到上下文中
   *
   * 中间件允许覆盖，优先级依次从上到下
   *
   * 中间件的规范写法为，options 是同名配置获取的
   * ```js
   * // app/middleware/status.js
   * module.exports = function(options, app) {
   *   // options == app.config.status
   *   return function*(next) {
   *     yield next;
   *   }
   * }
   * ```
   * @method EggLoader#loadMiddleware
   * @param {Object} opt - loading 参数
   */
  loadMiddleware(opt) {

    const app = this.app;
    opt = Object.assign({
      // 加载中间件，但是不调用它
      call: false,
      override: true,
      lowercaseFirst: true,
    }, opt);
    const middlewarePaths = this.loadDirs().map(dir => join(dir, 'app/middleware'));

    this.loadToApp(middlewarePaths, 'middlewares', opt);

    app.coreLogger.info('Use coreMiddleware order: %j', this.config.coreMiddleware);
    app.coreLogger.info('Use appMiddleware order: %j', this.config.appMiddleware);

    // 将中间件加载到 koa 中
    // 通过 app.config.coreMiddleware, app.config.appMiddleware 配置的顺序加载
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
