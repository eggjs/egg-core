'use strict';

const path = require('path');
const assert = require('assert');
const request = require('supertest');
const utils = require('../../utils');

describe('test/loader/mixin/load_middleware.test.js', function() {
  let app;
  before(function() {
    app = utils.createApp('middleware-override');
    app.loader.loadPlugin();
    app.loader.loadConfig();
    app.loader.loadMiddleware();
    app.loader.loadController();
    app.loader.loadRouter();
    app[Symbol.for('EggCore#startBoot')]();
  });
  after(() => app.close());

  it('should load application, plugin, and default middlewares', function() {
    assert('static' in app.middlewares);
    assert('status' in app.middlewares);
    assert('custom' in app.middlewares);
    assert('b' in app.middlewares);
    assert(!('a' in app.middlewares));
  });

  it('should also support app.middleware', function() {
    assert('static' in app.middleware);
    assert('status' in app.middleware);
    assert('custom' in app.middleware);
    assert('b' in app.middleware);
    assert(!('a' in app.middleware));

    assert(app.middleware.static === app.middlewares.static);
    for (const mw of app.middleware) {
      assert(typeof mw === 'function');
    }
    assert(Object.keys(app.middleware).length === 3);
  });

  it('should override middlewares of plugin by framework', async () => {
    await request(app.callback())
      .get('/status')
      .expect('egg status');
  });

  it('should override middlewares of plugin by application', async () => {
    await request(app.callback())
      .get('/custom')
      .expect('app custom');
  });

  it('should override middlewares of egg by application', async () => {
    await request(app.callback())
      .get('/static')
      .expect('static');
  });

  it('should throw when middleware return no-generator', function() {
    const app = utils.createApp('custom_session_invaild');
    assert.throws(() => {
      app.loader.loadPlugin();
      app.loader.loadConfig();
      app.loader.loadMiddleware();
      app[Symbol.for('EggCore#startBoot')]();
    }, /Middleware session must be a function, but actual is {}/);
  });

  it('should throw when not load that is not configured', function() {
    const app = utils.createApp('no-middleware');
    assert.throws(() => {
      app.loader.loadPlugin();
      app.loader.loadConfig();
      app.loader.loadMiddleware();
      app[Symbol.for('EggCore#startBoot')]();
    }, /Middleware a not found/);
  });

  it('should throw when middleware name redefined', function() {
    const app = utils.createApp('middleware-redefined');
    assert.throws(() => {
      app.loader.loadPlugin();
      app.loader.loadConfig();
      app.loader.loadMiddleware();
      app[Symbol.for('EggCore#startBoot')]();
    }, /Middleware status redefined/);
  });

  it('should core middleware support options.enable', async () => {
    const app = utils.createApp('middleware-disable');
    app.loader.loadPlugin();
    app.loader.loadConfig();
    app.loader.loadMiddleware();
    app.loader.loadController();
    app.loader.loadRouter();
    app[Symbol.for('EggCore#startBoot')]();

    await request(app.callback())
      .get('/status')
      .expect(404);
    app.close();
  });

  it('should core middleware support options.match', async () => {
    const app = utils.createApp('middleware-match');
    app.loader.loadPlugin();
    app.loader.loadConfig();
    app.loader.loadMiddleware();
    app.loader.loadController();
    app.loader.loadRouter();
    app[Symbol.for('EggCore#startBoot')]();

    await request(app.callback())
      .get('/status')
      .expect('egg status');

    await request(app.callback())
      .post('/status')
      .expect(404);
    app.close();
  });

  it('should core middleware support options.ignore', async () => {
    const app = utils.createApp('middleware-ignore');
    app.loader.loadPlugin();
    app.loader.loadConfig();
    app.loader.loadMiddleware();
    app.loader.loadController();
    app.loader.loadRouter();
    app[Symbol.for('EggCore#startBoot')]();

    await request(app.callback())
      .post('/status')
      .expect('egg status');

    await request(app.callback())
      .get('/status')
      .expect(404);
    app.close();
  });

  it('should app middleware support options.enable', async () => {
    const app = utils.createApp('middleware-app-disable');
    app.loader.loadPlugin();
    app.loader.loadConfig();
    app.loader.loadMiddleware();
    app.loader.loadController();
    app.loader.loadRouter();
    app[Symbol.for('EggCore#startBoot')]();

    await request(app.callback())
      .get('/static')
      .expect(404);
    app.close();
  });

  describe('async functions and common functions', () => {
    let app;
    before(() => {
      app = utils.createApp('middleware-aa');
      app.loader.loadPlugin();
      app.loader.loadConfig();
      app.loader.loadCustomApp();
      app.loader.loadMiddleware();
      app.loader.loadController();
      app.loader.loadRouter();
      app[Symbol.for('EggCore#startBoot')]();
    });

    after(() => app.close());

    it('should support config.middleware', async () => {
      await request(app.callback())
        .get('/static')
        .expect('static', 'static')
        .expect('hello');
    });

    it('should support app.use', async () => {
      await request(app.callback())
        .get('/')
        .expect('custom', 'custom')
        .expect('hello');
    });

    it('should support with router', async () => {
      await request(app.callback())
        .get('/router')
        .expect('router', 'router')
        .expect('hello');
    });

    it('should support with options.match', async () => {
      await request(app.callback())
        .get('/match')
        .expect('match', 'match')
        .expect('hello');
    });

    it('should support common functions', async () => {
      await request(app.callback())
        .get('/common')
        .expect('common');
    });
  });

  describe('middleware in other directory', () => {
    let app;
    before(() => {
      const baseDir = utils.getFilepath('other-directory');
      app = utils.createApp('other-directory');
      app.loader.loadPlugin();
      app.loader.loadConfig();

      const directory = app.loader.getLoadUnits().map(unit => path.join(unit.path, 'app/middleware'));
      directory.push(path.join(baseDir, 'app/other-middleware'));
      app.loader.loadMiddleware({
        directory,
      });
      app[Symbol.for('EggCore#startBoot')]();
      return app.ready();
    });
    after(() => app.close());

    it('should load', () => {
      assert(app.middlewares.user);
    });
  });
});
