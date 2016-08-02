'use strict';

const path = require('path');
const KoaApplication = require('koa');
const Router = require('koa-router');
const BaseLoader = require('..');

class EggApplication extends KoaApplication {
  get [Symbol.for('egg#eggPath')]() {
    return path.join(__dirname, 'fixtures/egg');
  }
}

class TestLoader extends BaseLoader {

  constructor(name, options) {
    options = options || {};
    if (!options.app) {
      options.app = new EggApplication();
    }
    options.baseDir = path.join(__dirname, 'fixtures', name);
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
    const app = new EggApplication();
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
    const agent = new EggApplication();
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
