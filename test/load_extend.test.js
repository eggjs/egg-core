'use strict';

require('should');
const request = require('supertest');
const koa = require('koa');
const utils = require('./utils');
const Loader = utils.Loader;

describe('test/load_extend.test.js', function() {

  let app;
  before(function() {
    app = utils.createApp('extend');
  });

  it('should load app.context app.request app.response', function(done) {
    app.context.should.have.property('appContext');
    app.context.should.have.property('pluginbContext');
    app.context.should.not.have.property('pluginaContext');
    app.request.should.have.property('appRequest');
    app.request.should.have.property('pluginbRequest');
    app.request.should.not.have.property('pluginaRequest');
    app.response.should.have.property('appResponse');
    app.response.should.have.property('pluginbResponse');
    app.response.should.not.have.property('pluginaResponse');
    app.should.have.property('appApplication');
    app.should.have.property('pluginbApplication');
    app.should.not.have.property('pluginaApplication');

    request(app.callback())
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
    })
    .expect(200, done);
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
    (function() {
      const app = koa();
      app.coreLogger = console;
      const loader = new Loader('load_context_error', {
        app,
      });
      loader.loadConfig();
      loader.load();
    }).should.throw(/Cannot find module 'this is a pen'/);
  });

  it('should throw when syntax error', function() {
    (function() {
      const app = koa();
      app.coreLogger = console;
      const loader = new Loader('load_context_syntax_error', {
        app,
      });
      loader.loadConfig();
      loader.load();
    }).should.throw(/ error: Unexpected token/);
  });

  it('should extend symbol', function() {
    const app = koa();
    app.coreLogger = console;
    const loader = new Loader('extend-symbol', {
      app,
    });
    loader.loadConfig();
    loader.load();
    app[utils.symbol.view].should.equal('view');
  });
});
