'use strict';

const request = require('supertest');
const assert = require('assert');
const utils = require('./utils');

describe('test/egg-ts.test.js', () => {
  let app;

  afterEach(() => {
    delete require.extensions['.ts'];
  });

  it('should support load ts file', async () => {
    require.extensions['.ts'] = require.extensions['.js'];
    app = utils.createApp('egg-ts', {
      typescript: true,
    });

    app.Helper = class Helper {};
    app.loader.loadPlugin();
    app.loader.loadConfig();
    app.loader.loadApplicationExtend();
    app.loader.loadAgentExtend();
    app.loader.loadRequestExtend();
    app.loader.loadResponseExtend();
    app.loader.loadContextExtend();
    app.loader.loadHelperExtend();
    app.loader.loadService();
    app.loader.loadController();
    app.loader.loadRouter();
    app.loader.loadPlugin();
    app.loader.loadMiddleware();
    app.loader.loadCustomApp();
    app.loader.loadCustomAgent();

    await request(app.callback())
      .get('/')
      .expect(res => {
        assert(res.text.includes('from extend context'));
        assert(res.text.includes('from extend application'));
        assert(res.text.includes('from extend request'));
        assert(res.text.includes('from extend agent'));
        assert(res.text.includes('from extend helper'));
        assert(res.text.includes('from extend response'));
        assert(res.text.includes('from custom app'));
        assert(res.text.includes('from custom agent'));
        assert(res.text.includes('from plugins'));
        assert(res.text.includes('from config.default'));
        assert(res.text.includes('from middleware'));
        assert(res.text.includes('from service'));
      })
      .expect(200);
  });

  it('should not load d.ts files while typescript was true', async () => {
    require.extensions['.ts'] = require.extensions['.js'];
    app = utils.createApp('egg-ts-js', {
      typescript: true,
    });

    app.loader.loadController();
    assert(!app.controller.god);
    assert(app.controller.test);
  });

  it('should support load ts,js files', async () => {
    require.extensions['.ts'] = require.extensions['.js'];
    app = utils.createApp('egg-ts-js', {
      typescript: true,
    });

    app.loader.loadService();
    assert(app.serviceClasses.lord);
    assert(app.serviceClasses.test);
  });

  it('should not load ts files while typescript was false', async () => {
    require.extensions['.ts'] = require.extensions['.js'];
    app = utils.createApp('egg-ts-js');

    app.loader.loadService();
    assert(app.serviceClasses.lord);
    assert(!app.serviceClasses.test);
  });
});
