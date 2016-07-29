'use strict';

require('should');
const join = require('path').join;
const request = require('supertest');
const koa = require('koa');
const utils = require('./utils');
const Loader = utils.Loader;

describe('test/load_extend.test.js', function() {

  let app;
  before(function() {
    app = utils.createApp('extend');
  });

  it('应该加载 app.context app.request app.response', function(done) {
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

  it('app 覆盖 chair 的', function(done) {
    request(app.callback())
    .get('/merge/app_override_chair')
    .expect({
      value: 'app ajax patch',
    })
    .expect(200, done);
  });

  it('plugin 覆盖 chair 的', function(done) {
    request(app.callback())
    .get('/merge/plugin_override_chair')
    .expect({
      value: '0.0.0.0',
    })
    .expect(200, done);
  });

  it('app 覆盖 plugin 的', function(done) {
    request(app.callback())
    .get('/merge/app_override_plugin')
    .expect({
      value: 'will override plugin',
    })
    .expect(200, done);
  });

  it('当无法找到依赖时应该抛错', function() {
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

  it('当文件语法异常时该抛错并给出错误文件地址', function() {
    (function() {
      const app = koa();
      app.coreLogger = console;
      const loader = new Loader('load_context_syntax_error', {
        app,
      });
      loader.loadConfig();
      loader.load();
    }).should.throw(/load_context_syntax_error\/app\/extend\/context\.js error: Unexpected token \)/);
  });

  it.skip('插件之间不允许覆盖，若有则报错', function() {
    const baseDir = utils.getFilepath('plugin_conflict_error');
    (function() {
      const app = koa();
      app.coreLogger = console;
      const loader = new Loader('plugin_conflict_error', {
        app,
      });
      loader.loadConfig();
      loader.load();
    }).should.throw(`Property: "app.context.foo" conflicted, it is defined in [ "${join(baseDir, 'node_modules/a/app/context')}", "${join(baseDir, 'node_modules/b/app/context')}" ]`);
  });

  it('应该合并 symbol', function() {
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
