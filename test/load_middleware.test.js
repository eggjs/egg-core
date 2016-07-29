'use strict';

require('should');
const request = require('supertest');
const utils = require('./utils');

describe('test/load_middleware.test.js', function() {

  let app;
  before(function() {
    app = utils.createApp('middleware-override');
  });

  it('应该加载应用，插件和默认中间件', function() {
    app.middlewares.should.have.property('static');
    app.middlewares.should.have.property('status');
    app.middlewares.should.have.property('custom');
    app.middlewares.should.have.property('b');
    app.middlewares.should.not.have.property('a');
  });

  it('插件中间件会覆盖 egg 的中间件', function(done) {
    request(app.callback())
    .get('/status')
    .expect('status')
    .end(done);
  });

  it('应用中间件会覆盖插件中间件', function(done) {
    request(app.callback())
    .get('/custom')
    .expect('app custom')
    .end(done);
  });

  it('应用中间件会覆盖 egg 的中间件', function(done) {
    request(app.callback())
    .get('/static')
    .expect('static')
    .end(done);
  });

  it('如果中间件返回的非 generator 会报错', function() {
    (function() {
      utils.createApp('custom_session_invaild');
    }).should.throw('Middleware session must be a generator function, but actual is {}');
  });

  it('未找到配置的中间件', function() {
    (function() {
      utils.createApp('no-middleware');
    }).should.throw('Middleware a not found');
  });
});
