'use strict';

const request = require('supertest');
const assert = require('assert');
const utils = require('./utils');
const tsNode = require('ts-node');

describe('test/egg-ts.test.js', () => {
  let app;

  it('should support ts-node', async () => {
    tsNode.register({
      typeCheck: true,
      compilerOptions: {
        target: 'es2017',
        module: 'commonjs',
        moduleResolution: 'node',
      },
    });

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
});
