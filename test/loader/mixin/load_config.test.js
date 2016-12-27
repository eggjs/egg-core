'use strict';

const path = require('path');
const assert = require('assert');
const utils = require('../../utils');

describe('test/loader/mixin/load_config.test.js', function() {

  let app;
  afterEach(() => app.close());

  it('should load application config overriding default of egg', function() {
    app = utils.createApp('config');
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();
    assert(loader.config.name === 'config-test');
    assert(loader.config.test === 1);
    // 支持嵌套覆盖
    assert.deepEqual(loader.config.urllib, {
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
    assert(loader.config.name === 'override default');
  });

  it('should load application config overriding plugin', function() {
    app = utils.createApp('plugin');
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();
    assert(loader.config.plugin === 'override plugin');
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
    assert(loader.config.egg === 'egg-unittest');
  });

  it('should not load config of plugin that is disabled', function() {
    app = utils.createApp('plugin');
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();
    assert(!loader.config.pluginA);
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
    assert.throws(() => {
      loader.loadPlugin();
      loader.loadConfig();
    }, new RegExp(`Can not define middleware in ${path.join(pluginDir, 'config/config.default.js')}`));
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
    assert.throws(() => {
      loader.loadPlugin();
      loader.loadConfig();
    }, new RegExp(`Can not define proxy in ${path.join(pluginDir, 'config/config.default.js')}`));
  });

  it('should throw when app define coreMiddleware', function() {
    app = utils.createApp('app-core-middleware');
    assert.throws(() => {
      app.loader.loadPlugin();
      app.loader.loadConfig();
    }, new RegExp('Can not define coreMiddleware in app or plugin'));
  });

  it('should read appinfo from the function of config', function() {
    app = utils.createApp('preload-app-config');
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();
    assert(loader.config.plugin.val === 2);
    assert(loader.config.plugin.val === 2);
    assert(loader.config.plugin.sub !== loader.config.app.sub);
    assert(loader.config.appInApp === false);
  });
});
