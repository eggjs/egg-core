'use strict';

const path = require('path');
const assert = require('assert');
const mm = require('mm');
const utils = require('../../utils');
const Application = require('../../..').EggCore;

describe('test/loader/mixin/load_config.test.js', () => {
  let app;
  afterEach(() => app.close());
  afterEach(mm.restore);

  it('should load application config overriding default of egg', () => {
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

  it('should load plugin config overriding default of egg', () => {
    app = utils.createApp('plugin');
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();
    assert(loader.config.name === 'override default');
  });

  it('should load application config overriding plugin', () => {
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
  it('should load config by env', () => {
    app = utils.createApp('config-env');
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();
    assert(loader.config.egg === 'egg-unittest');
  });

  it('should not load config of plugin that is disabled', () => {
    app = utils.createApp('plugin');
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();
    assert(!loader.config.pluginA);
  });

  it('should throw when plugin define middleware', () => {
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
    try {
      loader.loadPlugin();
      loader.loadConfig();
      throw new Error('should not run');
    } catch (err) {
      assert(err.message.includes(`Can not define middleware in ${path.join(pluginDir, 'config/config.default.js')}`));
    }
  });

  it('should throw when app define coreMiddleware', () => {
    app = utils.createApp('app-core-middleware');
    assert.throws(() => {
      app.loader.loadPlugin();
      app.loader.loadConfig();
    }, new RegExp('Can not define coreMiddleware in app or plugin'));
  });

  it('should read appinfo from the function of config', () => {
    app = utils.createApp('preload-app-config');
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();
    assert(loader.config.plugin.val === 2);
    assert(loader.config.plugin.val === 2);
    assert(loader.config.plugin.sub !== loader.config.app.sub);
    assert(loader.config.appInApp === false);
  });

  it('should load config without coreMiddleware', () => {
    app = new Application({
      baseDir: path.join(__dirname, '../../fixtures/no-core-middleware'),
    });
    app.loader.loadPlugin();
    app.loader.loadConfig();
    assert(app.config.coreMiddleware.length === 0);
  });

  it('should override array', () => {
    app = utils.createApp('config-array');
    app.loader.loadPlugin();
    app.loader.loadConfig();
    assert.deepEqual(app.config.array, [ 1, 2 ]);
  });

  it('should generate configMeta', () => {
    app = utils.createApp('configmeta');
    app.loader.loadPlugin();
    app.loader.loadConfig();
    const configMeta = app.loader.configMeta;
    const configPath = utils.getFilepath('configmeta/config/config.js');
    assert(configMeta.console === configPath);
    assert(configMeta.array === configPath);
    assert(configMeta.buffer === configPath);
    assert(configMeta.ok === configPath);
    assert(configMeta.f === configPath);
    assert(configMeta.empty === configPath);
    assert(configMeta.zero === configPath);
    assert(configMeta.number === configPath);
    assert(configMeta.no === configPath);
    assert(configMeta.date === configPath);
    assert(configMeta.ooooo === configPath);

    assert(configMeta.urllib.keepAlive === configPath);
    assert(configMeta.urllib.timeout === utils.getFilepath('egg/config/config.default.js'));
    assert(configMeta.urllib.foo === configPath);
    assert(configMeta.urllib.n === configPath);
    assert(configMeta.urllib.dd === configPath);
    assert(configMeta.urllib.httpclient === configPath);
    // undefined will be ignore
    assert(!configMeta.urllib.bar);
  });

  describe('get config with scope', () => {
    it('should return without scope when env = default', async () => {
      mm(process.env, 'EGG_SERVER_ENV', 'default');
      app = utils.createApp('scope-env');
      const loader = app.loader;
      loader.loadPlugin();
      app.loader.loadConfig();
      assert(loader.config.from === 'default');
    });

    it('should return without scope when env = prod', async () => {
      mm(process.env, 'EGG_SERVER_ENV', 'prod');
      app = utils.createApp('scope-env');
      const loader = app.loader;
      loader.loadPlugin();
      app.loader.loadConfig();
      assert(loader.config.from === 'prod');
    });

    it('should return with scope when env = default', async () => {
      mm(process.env, 'EGG_SERVER_ENV', 'default');
      mm(process.env, 'EGG_SERVER_SCOPE', 'en');
      app = utils.createApp('scope-env');
      const loader = app.loader;
      loader.loadPlugin();
      app.loader.loadConfig();
      assert(loader.config.from === 'en');
    });

    it('should return with scope when env = prod', async () => {
      mm(process.env, 'EGG_SERVER_ENV', 'prod');
      mm(process.env, 'EGG_SERVER_SCOPE', 'en');
      app = utils.createApp('scope-env');
      const loader = app.loader;
      loader.loadPlugin();
      app.loader.loadConfig();
      assert(loader.config.from === 'en_prod');
    });
  });
});
