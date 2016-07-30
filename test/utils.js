'use strict';

const path = require('path');
const koa = require('koa');
const Router = require('koa-router');
const BaseLoader = require('..');

class TestLoader extends BaseLoader {

  constructor(name, options) {
    options = options || {};
    options.baseDir = path.join(__dirname, 'fixtures', name);
    options.eggPath = path.join(__dirname, 'fixtures/egg');
    super(options);
  }

  loadConfig() {
    super.loadPlugin();
    super.loadConfig();
  }

  load() {
    this.loadApplication();
    this.loadRequest();
    this.loadResponse();
    this.loadContext();
    this.loadHelper();

    this.loadCustomApp();
    this.loadProxy();
    this.loadService();
    this.loadMiddleware();
    this.loadController();
    this.loadRouter();
  }

  loadRouter() {
    const app = this.app;
    const routerMiddleware = new Router(app, { sensitive: true });
    app.use(routerMiddleware.middleware());
    // 加载 router.js
    this.loadFile(path.join(this.options.baseDir, 'app/router.js'));
  }
}

module.exports = {

  getFilepath(name) {
    return path.join(__dirname, 'fixtures', name);
  },

  createApp(name, options) {
    options = options || {};
    const app = koa();
    options.app = app;
    app.coreLogger = console;
    app.loader = new this.Loader(name, options);
    app.loader.loadConfig();
    app.config = app.loader.config;
    app.antx = app.loader.antx;
    app.loader.load();
    return app;
  },

  createAgent(name, options) {
    options = options || {};
    const agent = {};
    options.app = agent;
    agent.coreLogger = console;
    agent.loader = new this.Loader(name, options);
    agent.loader.loadConfig();
    agent.config = agent.loader.config;
    agent.antx = agent.loader.antx;
    agent.loader.loadAgent();
    agent.loader.loadCustomAgent();
    return agent;
  },

  Loader: TestLoader,

  symbol: {
    view: Symbol('view'),
  },

};
