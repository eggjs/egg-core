'use strict';

const should = require('should');
const path = require('path');
const utils = require('../../utils');

describe('test/loader/mixin/load_config.test.js', function() {

  let app;
  afterEach(() => app.close());

  it('should load application config overriding default of egg', function() {
    app = utils.createApp('config');
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();
    loader.config.name.should.eql('config-test');
    loader.config.test.should.eql(1);
    // 支持嵌套覆盖
    loader.config.urllib.should.eql({
      keepAlive: false,
      keepAliveTimeout: 30000,
      timeout: 30000,
      maxSockets: Infinity,
      maxFreeSockets: 256,
    });
  });

  it('should load plugin config overriding default of egg', function() {
    app = utils.createApp('plugin');
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();
    loader.config.name.should.eql('override default');
  });

  it('should load application config overriding plugin', function() {
    app = utils.createApp('plugin');
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();
    loader.config.plugin.should.eql('override plugin');
  });

  // egg config.default
  //   framework config.default
  //     egg config.local
  //       framework config.local
  it('should load config by env', function() {
    app = utils.createApp('config-env');
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();
    loader.config.egg.should.eql('egg-unittest');
  });

  it('should not load config of plugin that is disabled', function() {
    app = utils.createApp('plugin');
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();
    should.not.exists(loader.config.pluginA);
  });

  it('should throw when plugin define middleware', function() {
    const pluginDir = utils.getFilepath('plugin/plugin-middleware');
    app = utils.createApp('plugin', {
      plugins: {
        middleware: {
          enable: true,
          path: pluginDir,
        },
      },
    });
    const loader = app.loader;
    (function() {
      loader.loadPlugin();
      loader.loadConfig();
    }).should.throw(`Can not define middleware in ${path.join(pluginDir, 'config/config.default.js')}`);
  });

  it('should throw when plugin define proxy', function() {
    const pluginDir = utils.getFilepath('plugin/plugin-proxy');
    app = utils.createApp('plugin', {
      plugins: {
        proxy: {
          enable: true,
          path: pluginDir,
        },
      },
    });
    const loader = app.loader;
    (function() {
      loader.loadPlugin();
      loader.loadConfig();
    }).should.throw(`Can not define proxy in ${path.join(pluginDir, 'config/config.default.js')}`);
  });

  it('should throw when app define coreMiddleware', function() {
    app = utils.createApp('app-core-middleware');
    (function() {
      app.loader.loadPlugin();
      app.loader.loadConfig();
    }).should.throw('Can not define coreMiddleware in app or plugin');
  });

  it('should read appinfo from the function of config', function() {
    app = utils.createApp('preload-app-config');
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();
    loader.config.plugin.val.should.eql(2);
    loader.config.plugin.val.should.eql(2);
    loader.config.plugin.sub.should.not.equal(loader.config.app.sub);
    loader.config.appInApp.should.false();
  });
});
