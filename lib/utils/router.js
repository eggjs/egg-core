'use strict';

const is = require('is-type-of');
const KoaRouter = require('koa-router');
const utility = require('utility');
const inflection = require('inflection');
const methods = require('./index').methods;
const utils = require('./index');

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

    // regist router by http method.
    methods.concat([ 'all', 'del', 'resources', 'register' ]).forEach(method => {
      app[method] = function(...args) {
        // resolve string controller('post.index') to function
        args = resolveController(args, app);
        if (method !== 'resources' && method !== 'register') {
          // wrap middleware to support async function
          args = wrapMiddleware(args);
        }
        router[method].apply(router, args);
        return this;
      };
    });

    // other methods
    [ 'redirect', 'param' ].forEach(method => {
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
      const action = controller[key];
      if (!action) continue;

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
}

/**
 * make controller(last argument) support string
 * - [url, controller]: app.get('/home', 'home');
 * - [name, url, controller(string)]: app.get('posts', '/posts', 'posts.list');
 * - [name, url, controller]: app.get('posts', '/posts', app.controller.posts.list);
 * - [name, url(regexp), controller]: app.get('regRouter', /\/home\/index/, 'home.index');
 * - [name, url, middleware, [...], controller]: `app.get(/user/:id', hasLogin, canGetUser, 'user.show');`
 *
 * @param  {arguments} args egg router arguments
 * @param  {Application} app  egg application instance
 * @return {Array} koa-router arguments
 */
function resolveController(args, app) {
  // controller support string('post.index')
  const controller = args[args.length - 1];
  if (typeof controller !== 'string') return args;

  const actions = controller.split('.');
  let obj = app.controller;
  actions.forEach(key => {
    obj = obj[key];
    if (!obj) throw new Error(`controller '${controller}' not exists`);
  });
  return args.slice(0, -1).concat([ obj ]);
}

/**
 * wrap middlewares to support async function
 *
 * @param  {arguments} args egg router arguments
 * @return {Array} koa-router arguments
 */
function wrapMiddleware(args) {
  let prefix;
  let middlewares;
  if (args.length >= 3 && is.string(args[1])) {
    // app.get(name, url, [middleware...], controller)
    prefix = args.slice(0, 2);
    middlewares = args.slice(2, -1);
  } else {
    // app.get(url, [middleware...], controller)
    prefix = args.slice(0, 1);
    middlewares = args.slice(1, -1);
  }

  // wrap middlewares to support async function
  middlewares = middlewares.map(utils.middleware);

  const controller = args[args.length - 1];

  return prefix.concat(middlewares).concat([ controller ]);
}

module.exports = Router;
