'use strict';

const mm = require('mm');
const request = require('supertest');
const assert = require('assert');
const utils = require('./utils');
const path = require('path');
const coffee = require('coffee');
const loaderUtil = require('../lib/utils');

describe('test/egg-ts.test.js', () => {
  let app;

  beforeEach(() => {
    require.extensions['.ts'] = require.extensions['.js'];
    loaderUtil.extensions['.ts'] = require.extensions['.js'];
  });

  afterEach(() => {
    mm.restore();
    delete require.extensions['.ts'];
    delete loaderUtil.extensions['.ts'];
  });

  describe('load ts file', () => {
    describe('load app', () => {
      it('should success', async () => {
        mm(process.env, 'EGG_TYPESCRIPT', 'true');
        app = utils.createApp('egg-ts');

        app.Helper = class Helper {};
        app.loader.loadPlugin();
        app.loader.loadConfig();
        app.loader.loadApplicationExtend();
        app.loader.loadAgentExtend();
        app.loader.loadRequestExtend();
        app.loader.loadResponseExtend();
        app.loader.loadContextExtend();
        app.loader.loadHelperExtend();
        app.loader.loadCustomApp();
        app.loader.loadService();
        app.loader.loadController();
        app.loader.loadRouter();
        app.loader.loadPlugin();
        app.loader.loadMiddleware();

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
            assert(res.text.includes('from plugins'));
            assert(res.text.includes('from config.default'));
            assert(res.text.includes('from middleware'));
            assert(res.text.includes('from service'));
          })
          .expect(200);
      });
    });

    describe('load agent', () => {
      it('should success', async () => {
        mm(process.env, 'EGG_TYPESCRIPT', 'true');
        app = utils.createApp('egg-ts');

        app.Helper = class Helper {};
        app.loader.loadPlugin();
        app.loader.loadConfig();
        app.loader.loadApplicationExtend();
        app.loader.loadAgentExtend();
        app.loader.loadRequestExtend();
        app.loader.loadResponseExtend();
        app.loader.loadContextExtend();
        app.loader.loadHelperExtend();
        app.loader.loadCustomAgent();
        app.loader.loadService();
        app.loader.loadController();
        app.loader.loadRouter();
        app.loader.loadPlugin();
        app.loader.loadMiddleware();

        await request(app.callback())
          .get('/')
          .expect(res => {
            assert(res.text.includes('from extend context'));
            assert(res.text.includes('from extend application'));
            assert(res.text.includes('from extend request'));
            assert(res.text.includes('from extend agent'));
            assert(res.text.includes('from extend helper'));
            assert(res.text.includes('from extend response'));
            assert(res.text.includes('from custom agent'));
            assert(res.text.includes('from plugins'));
            assert(res.text.includes('from config.default'));
            assert(res.text.includes('from middleware'));
            assert(res.text.includes('from service'));
          })
          .expect(200);
      });
    });
  });

  it('should not load d.ts files while typescript was true', async () => {
    mm(process.env, 'EGG_TYPESCRIPT', 'true');
    app = utils.createApp('egg-ts-js');

    app.loader.loadController();
    assert(!app.controller.god);
    assert(app.controller.test);
  });

  it('should support load ts,js files', async () => {
    mm(process.env, 'EGG_TYPESCRIPT', 'true');
    app = utils.createApp('egg-ts-js');

    app.loader.loadService();
    assert(app.serviceClasses.lord);
    assert(app.serviceClasses.test);
  });

  it('should not load ts files while EGG_TYPESCRIPT was not exist', async () => {
    app = utils.createApp('egg-ts-js');

    app.loader.loadApplicationExtend();
    app.loader.loadService();
    assert(!app.appExtend);
    assert(app.serviceClasses.lord);
    assert(!app.serviceClasses.test);
  });

  it('should not load ts files while EGG_TYPESCRIPT was true but no extensions', async () => {
    mm(process.env, 'EGG_TYPESCRIPT', 'true');
    mm(loaderUtil, 'extensions', [ '.js', '.json' ]);
    app = utils.createApp('egg-ts-js');
    app.loader.loadService();
    assert(app.serviceClasses.lord);
    assert(!app.serviceClasses.test);
  });

  it('should compile app-ts without error', async () => {
    await coffee
      .spawn('node', [ '--require', 'ts-node/register/type-check', path.resolve(__dirname, './fixtures/app-ts/app.ts') ], {
        env: Object.assign({}, process.env, {
          TS_NODE_PROJECT: path.resolve(__dirname, './fixtures/app-ts/tsconfig.json'),
        }),
      })
      // .debug()
      .expect('code', 0)
      .end();
  });

  it('should compile error with app-ts/error', async () => {
    await coffee
      .spawn('node', [ '--require', 'ts-node/register/type-check', path.resolve(__dirname, './fixtures/app-ts/app-error.ts') ], {
        env: Object.assign({}, process.env, {
          TS_NODE_PROJECT: path.resolve(__dirname, './fixtures/app-ts/tsconfig.json'),
        }),
      })
      // .debug()
      .expect('stderr', /Property 'abb' does not exist on type 'EggCore<{ env: string; }>'/)
      .expect('stderr', /Property 'abc' does not exist on type 'typeof BaseContextClass'/)
      .expect('stderr', /'loadPlugin' is protected/)
      .expect('stderr', /'loadConfig' is protected/)
      .expect('stderr', /'loadApplicationExtend' is protected/)
      .expect('stderr', /'loadAgentExtend' is protected/)
      .expect('stderr', /'loadRequestExtend' is protected/)
      .expect('stderr', /'loadResponseExtend' is protected/)
      .expect('stderr', /'loadContextExtend' is protected/)
      .expect('stderr', /'loadHelperExtend' is protected/)
      .expect('stderr', /'loadCustomAgent' is protected/)
      .expect('stderr', /'loadService' is protected/)
      .expect('stderr', /'loadController' is protected/)
      .expect('stderr', /'ctx' is protected/)
      .expect('code', 1)
      .end();
  });
});
