'use strict';

const KoaRouter = require('koa-router');
const utility = require('utility');
const inflection = require('inflection');
const methods = require('./index').methods;

const REST_MAP = {
  index: {
    suffix: '',
    method: 'GET',
  },
  new: {
    namePrefix: 'new_',
    member: true,
    suffix: 'new',
    method: 'GET',
  },
  create: {
    suffix: '',
    method: 'POST',
  },
  show: {
    member: true,
    suffix: ':id',
    method: 'GET',
  },
  edit: {
    member: true,
    namePrefix: 'edit_',
    suffix: ':id/edit',
    method: 'GET',
  },
  update: {
    member: true,
    namePrefix: '',
    suffix: ':id',
    method: 'PUT',
  },
  destroy: {
    member: true,
    namePrefix: 'destroy_',
    suffix: ':id',
    method: 'DELETE',
  },
};

const slice = Array.prototype.slice;

class Router extends KoaRouter {

  /**
   * @constructor
   * @param {Object} opts - Router options.
   * @param {Application} app - Application object.
   */
  constructor(opts, app) {
    super(opts);
    this.app = app;

    // patch koa-router@5.x
    const router = this;
    app.url = this.url.bind(this);
    app.router = this;
    [ 'all', 'redirect', 'register', 'del', 'param', 'resources' ]
    .concat(methods)
    .forEach(method => {
      app[method] = function() {
        router[method].apply(router, arguments);
        return this;
      };
    });
  }

  /**
   * restful router api
   * @param {String} name - Router name
   * @param {String} prefix - url prefix
   * @param {Function} middleware - middleware or controller
   * @example
   * ```js
   * app.resources('/posts', 'posts')
   * app.resources('posts', '/posts', 'posts')
   * app.resources('posts', '/posts', app.role.can('user'), app.controller.posts)
   * ```
   *
   * Examples:
   *
   * ```js
   * app.resources('/posts', 'posts')
   * ```
   *
   * yield router mapping
   *
   * Method | Path            | Route Name     | Controller.Action
   * -------|-----------------|----------------|-----------------------------
   * GET    | /posts          | posts          | app.controller.posts.index
   * GET    | /posts/new      | new_post       | app.controller.posts.new
   * GET    | /posts/:id      | post           | app.controller.posts.show
   * GET    | /posts/:id/edit | edit_post      | app.controller.posts.edit
   * POST   | /posts          | posts          | app.controller.posts.create
   * PUT    | /posts/:id      | post           | app.controller.posts.update
   * DELETE | /posts/:id      | post           | app.controller.posts.destroy
   *
   * app.router.url can generate url based on arguments
   * ```js
   * app.router.url('posts')
   * => /posts
   * app.router.url('post', { id: 1 })
   * => /posts/1
   * app.router.url('new_post')
   * => /posts/new
   * app.router.url('edit_post', { id: 1 })
   * => /posts/1/edit
   * ```
   * @return {Route} return route object.
   */
  resources(name, prefix, middleware) {
    const route = this;
    if (typeof prefix === 'string') {
      middleware = slice.call(arguments, 2);
    } else {
      middleware = slice.call(arguments, 1);
      prefix = name;
      name = '';
    }

    // last argument is Controller object
    const controller = middleware.pop();

    for (const key in REST_MAP) {
      let action = '';
      if (typeof controller === 'string') {
        action = `${controller}.${key}`;
      } else {
        action = controller[key];
      }
      const opts = REST_MAP[key];

      let formatedName;
      if (opts.member) {
        formatedName = inflection.singularize(name);
      } else {
        formatedName = inflection.pluralize(name);
      }
      if (opts.namePrefix) {
        formatedName = opts.namePrefix + formatedName;
      }
      prefix = prefix.replace(/\/$/, '');
      const path = opts.suffix ? `${prefix}/${opts.suffix}` : prefix;
      route.register.call(this, path, [ opts.method ], middleware.concat(action), { name: formatedName });
    }

    return route;
  }

  /**
   * @param {String} name - Router name
   * @param {Object} params - more parameters
   * @example
   * ```js
   * router.url('edit_post', { id: 1, name: 'foo', page: 2 })
   * => /posts/1/edit?name=foo&page=2
   * router.url('posts', { name: 'foo&1', page: 2 })
   * => /posts?name=foo%261&page=2
   * ```
   * @return {String} url by path name and query params.
   */
  url(name, params) {
    const route = this.route(name);

    if (route) {
      const args = params;
      let url = route.path || route.regexp.source;

      const queries = [];
      if (typeof args === 'object' && args !== null) {
        const replacedParams = [];
        url = url.replace(/:([a-zA-Z_]\w*)/g, function($0, key) {
          if (utility.has(args, key)) {
            const values = args[key];
            replacedParams.push(key);
            return utility.encodeURIComponent(Array.isArray(values) ? values[0] : values);
          }
          return $0;
        });
        for (const key in args) {
          if (replacedParams.indexOf(key) !== -1) {
            continue;
          }

          const values = args[key];
          const encodedKey = utility.encodeURIComponent(key);
          if (Array.isArray(values)) {
            for (const val of values) {
              queries.push(`${encodedKey}=${utility.encodeURIComponent(val)}`);
            }
          } else {
            queries.push(`${encodedKey}=${utility.encodeURIComponent(values)}`);
          }
        }
      }

      if (queries.length > 0) {
        const queryStr = queries.join('&');
        if (url.indexOf('?') === -1) {
          url = `${url}?${queryStr}`;
        } else {
          url = `${url}&${queryStr}`;
        }
      }

      return url;
    }

    return '';
  }

  pathFor(name, params) {
    return this.url(name, params);
  }

  /**
   * override koa-router, controller can be string
   * @param {String} path Path string or regular expression.
   * @param {Array.<String>} methods Array of HTTP verbs.
   * @param {Function} middleware Multiple middleware also accepted.
   * @param {Object} opts options
   * @return {Route} route object.
   * @private
   * @example
   * before:
   *
   *    app.resources('posts', '/posts', app.controller.posts);
   *    app.get('/', '/posts', app.controller.home.index);
   *
   * After:
   *
   *    app.resources('posts', '/posts', 'posts');
   *    app.get('/', '/posts', 'home.index');
   *
   */
  register(path, methods, middleware, opts) {
    middleware = Array.isArray(middleware) ? middleware : [ middleware ];
    let action = middleware.pop();
    if (typeof action === 'string') {
      const actions = action.split('.');
      let obj = this.app.controller;
      actions.forEach(function(key) {
        obj = obj[key];
      });
      action = obj;
    }

    if (typeof action !== 'function') {
      return null;
    }

    middleware.push(action);
    return super.register.call(this, path, methods, middleware, opts);
  }
}

module.exports = Router;
