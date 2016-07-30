'use strict';

const should = require('should');
const Loader = require('./utils').Loader;

describe('test/load_config.test.js', function() {

  it('should load application config overriding default of egg', function() {
    const loader = new Loader('config');
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
    const loader = new Loader('plugin');
    loader.loadConfig();
    loader.config.name.should.eql('override default');
  });

  it('should load application config overriding plugin', function() {
    const loader = new Loader('plugin');
    loader.loadConfig();
    loader.config.plugin.should.eql('override plugin');
  });

  // egg config.default
  //   framework config.default
  //     egg config.local
  //       framework config.local
  it('should load config by env', function() {
    const loader = new Loader('config-env');
    loader.loadConfig();
    loader.config.egg.should.eql('egg-unittest');
  });

  it('should not load config of plugin that is disabled', function() {
    const loader = new Loader('plugin');
    loader.loadConfig();
    should.not.exists(loader.config.pluginA);
  });

  it('should delete config.middleware and config.proxy', function() {
    const loader = new Loader('plugin');
    loader.loadConfig();
    should.not.exists(loader.config.proxy);
    loader.config.coreMiddleware.should.not.containEql('d');
    loader.config.appMiddleware.should.not.containEql('d');
  });

  it('should read appinfo from the function of config', function() {
    const loader = new Loader('preload-app-config');
    loader.loadConfig();
    loader.config.plugin.val.should.eql(2);
    loader.config.plugin.val.should.eql(2);
    loader.config.plugin.sub.should.not.equal(loader.config.app.sub);
  });
});
