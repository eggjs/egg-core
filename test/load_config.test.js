'use strict';

const should = require('should');
const Loader = require('./utils').Loader;

describe('test/load_config.test.js', function() {

  it('加载应用配置，覆盖 egg 默认配置', function() {
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

  it('加载插件配置，覆盖 egg 默认配置', function() {
    const loader = new Loader('plugin');
    loader.loadConfig();
    loader.config.name.should.eql('override default');
  });

  it('加载插件配置，被 app 覆盖', function() {
    const loader = new Loader('plugin');
    loader.loadConfig();
    loader.config.plugin.should.eql('override plugin');
  });

  // egg config.default
  //   framework config.default
  //     egg config.local
  //       framework config.local
  it('应该根据环境加载配置', function() {
    const loader = new Loader('config-env');
    loader.loadConfig();
    loader.config.egg.should.eql('egg-unittest');
  });

  it('不会加载未开启插件的配置', function() {
    const loader = new Loader('plugin');
    loader.loadConfig();
    should.not.exists(loader.config.pluginA);
  });

  it('需要剔除 middleware 和 proxy', function() {
    const loader = new Loader('plugin');
    loader.loadConfig();
    should.not.exists(loader.config.proxy);
    loader.config.coreMiddleware.should.not.containEql('d');
    loader.config.appMiddleware.should.not.containEql('d');
  });

  it('config 函数可以读取应用配置', function() {
    const loader = new Loader('preload-app-config');
    loader.loadConfig();
    loader.config.plugin.val.should.eql(2);
    loader.config.plugin.val.should.eql(2);
    loader.config.plugin.sub.should.not.equal(loader.config.app.sub);
  });
});
