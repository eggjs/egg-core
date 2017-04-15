'use strict';

const request = require('supertest');
const mm = require('mm');
const assert = require('assert');
const utils = require('../../utils');

describe('test/loader/mixin/load_extend.test.js', () => {
  let app;
  before(function() {
    app = utils.createApp('extend');
    app.loader.loadPlugin();
    app.loader.loadConfig();
    app.loader.loadRequestExtend();
    app.loader.loadResponseExtend();
    app.loader.loadApplicationExtend();
    app.loader.loadContextExtend();
    app.loader.loadController();
    app.loader.loadRouter();
  });
  after(() => app.close());
  afterEach(mm.restore);

  it('should load app.context app.request app.response', () => {
    assert(app.context.appContext);
    assert(app.context.pluginbContext);
    assert(!app.context.pluginaContext);
    assert(app.request.appRequest);
    assert(app.request.pluginbRequest);
    assert(!app.request.pluginaRequest);
    assert(app.response.appResponse);
    assert(app.response.pluginbResponse);
    assert(!app.response.pluginaResponse);
    assert(app.appApplication);
    assert(app.pluginbApplication);
    assert(!app.pluginaApplication);

    return request(app.callback())
    .get('/')
    .expect({
      returnAppContext: 'app context',
      returnPluginbContext: 'plugin b context',
      returnAppRequest: 'app request',
      returnPluginbRequest: 'plugin b request',
      returnAppResponse: 'app response',
      returnPluginbResponse: 'plugin b response',
      returnAppApplication: 'app application',
      returnPluginbApplication: 'plugin b application',
      status: 200,
      etag: 'etag ok',
    })
    .expect(200);
  });

  it('should load application overriding framework', function(done) {
    request(app.callback())
    .get('/merge/app_override_chair')
    .expect({
      value: 'app ajax patch',
    })
    .expect(200, done);
  });

  it('should load plugin overriding framework', function(done) {
    request(app.callback())
    .get('/merge/plugin_override_chair')
    .expect({
      value: '0.0.0.0',
    })
    .expect(200, done);
  });

  it('should load application overriding plugin', function(done) {
    request(app.callback())
    .get('/merge/app_override_plugin')
    .expect({
      value: 'will override plugin',
    })
    .expect(200, done);
  });

  it('should throw when no deps', function() {
    assert.throws(() => {
      const app = utils.createApp('load_context_error');
      app.loader.loadContextExtend();
    }, /Cannot find module 'this is a pen'/);
  });

  it('should throw when syntax error', function() {
    assert.throws(() => {
      const app = utils.createApp('load_context_syntax_error');
      app.loader.loadContextExtend();
    }, /Parse Error: Unexpected token/);
  });

  it('should extend symbol', function() {
    const app = utils.createApp('extend-symbol');
    app.loader.loadApplicationExtend();
    assert.equal(app[utils.symbol.view], 'view');
  });

  it('should load application by custom env', function() {
    mm(process.env, 'EGG_SERVER_ENV', 'custom');
    const app = utils.createApp('extend-env');
    app.loader.loadPlugin();
    app.loader.loadApplicationExtend();
    assert(app.custom === true);
    // application.custom.js override application.js
    assert(app.a === 'a1');
    // application.custom.js in plugin also can override application.js in app
    assert(app.b === 'b1');
  });

  describe('load unittest extend', () => {
    let app;
    after(() => app.close());

    it('should load unittext.js when unittest', function* () {
      app = utils.createApp('load-plugin-unittest');
      app.loader.loadPlugin();
      app.loader.loadApplicationExtend();
      assert(app.unittest === true);
      assert(app.local !== true);
    });

    it('should load unittext.js when mm.env(default)', function* () {
      mm(process.env, 'EGG_SERVER_ENV', 'local');
      mm(process.env, 'EGG_MOCK_SERVER_ENV', 'local');
      app = utils.createApp('load-plugin-unittest');
      app.loader.loadPlugin();
      app.loader.loadApplicationExtend();
      assert(app.unittest === true);
      assert(app.local === true);
    });
  });
});
