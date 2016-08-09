'use strict';

require('should');
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
  });

  it('should load application, plugin, and default middlewares', function() {
    app.middlewares.should.have.property('static');
    app.middlewares.should.have.property('status');
    app.middlewares.should.have.property('custom');
    app.middlewares.should.have.property('b');
    app.middlewares.should.not.have.property('a');
  });

  it('should override middlewares of plugin by framework', function(done) {
    request(app.callback())
    .get('/status')
    .expect('egg status')
    .end(done);
  });

  it('should override middlewares of plugin by application', function(done) {
    request(app.callback())
    .get('/custom')
    .expect('app custom')
    .end(done);
  });

  it('should override middlewares of egg by application', function(done) {
    request(app.callback())
    .get('/static')
    .expect('static')
    .end(done);
  });

  it('should throw when middleware return no-generator', function() {
    const app = utils.createApp('custom_session_invaild');
    (function() {
      app.loader.loadPlugin();
      app.loader.loadConfig();
      app.loader.loadMiddleware();
    }).should.throw('Middleware session must be a generator function, but actual is {}');
  });

  it('should throw when not load that is not configured', function() {
    const app = utils.createApp('no-middleware');
    (function() {
      app.loader.loadPlugin();
      app.loader.loadConfig();
      app.loader.loadMiddleware();
    }).should.throw('Middleware a not found');
  });
});
