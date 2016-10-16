'use strict';

require('should');
const request = require('supertest');
const mm = require('mm');
const utils = require('../../utils');

describe('test/loader/mixin/load_extend.test.js', function() {

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
      const app = utils.createApp('load_context_error');
      app.loader.loadContextExtend();
    }).should.throw(/Cannot find module 'this is a pen'/);
  });

  it('should throw when syntax error', function() {
    (function() {
      const app = utils.createApp('load_context_syntax_error');
      app.loader.loadContextExtend();
    }).should.throw(/ error: Unexpected token/);
  });

  it('should extend symbol', function() {
    const app = utils.createApp('extend-symbol');
    app.loader.loadApplicationExtend();
    app[utils.symbol.view].should.equal('view');
  });

  it('should load application by custom env', function() {
    mm(process.env, 'EGG_SERVER_ENV', 'custom');
    const app = utils.createApp('extend-env');
    app.loader.loadPlugin();
    app.loader.loadApplicationExtend();
    app.custom.should.be.true();
    // application.custom.js override application.js
    app.a.should.eql('a1');
    // application.custom.js in plugin also can override application.js in app
    app.b.should.eql('b1');
  });

});
