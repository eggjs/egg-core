'use strict';

const should = require('should');
const path = require('path');
const mm = require('mm');
const utils = require('./utils');
const Loader = utils.Loader;

describe('test/load_plugin.test.js', function() {

  afterEach(mm.restore);

  it('should loadConfig all plugins', function() {
    const baseDir = utils.getFilepath('plugin');
    const loader = new Loader('plugin');
    loader.loadConfig();
    loader.plugins.b.should.eql({
      enable: true,
      name: 'b',
      dep: [],
      env: [],
      path: path.join(baseDir, 'node_modules/b'),
    });
    loader.plugins.c.should.eql({
      enable: true,
      name: 'c',
      dep: [],
      env: [],
      path: path.join(baseDir, 'node_modules/c'),
    });
    loader.plugins.e.should.eql({
      enable: true,
      name: 'e',
      dep: [ 'f' ],
      env: [],
      path: path.join(baseDir, 'plugins/e'),
    });
    // loader.plugins.onerror.should.eql({
    //   enable: true,
    //   name: 'onerror',
    //   dep: [],
    //   env: [],
    //   path: path.join(utils.eggPath, 'lib/plugins/onerror'),
    // });
    loader.orderPlugins.should.be.an.Array;
  });

  it('同名插件优先级，应用依赖库 > chair 依赖库 > chair 默认', function() {
    const baseDir = utils.getFilepath('plugin');
    const loader = new Loader('plugin');
    loader.loadConfig();

    loader.plugins.rds.should.eql({
      enable: true,
      name: 'rds',
      dep: [ 'session' ],
      env: [],
      package: 'rds',
      path: path.join(baseDir, 'node_modules/rds'),
    });
  });

  it('应用插件配置支持别名', function() {
    const baseDir = utils.getFilepath('plugin');
    const loader = new Loader('plugin');
    loader.loadConfig();

    loader.plugins.d1.should.eql({
      enable: true,
      name: 'd1',
      package: 'd',
      dep: [],
      env: [],
      path: path.join(baseDir, 'node_modules/d'),
    });
    should.not.exists(loader.plugins.d);
  });

  it('支持插件 package.json 配置', function() {
    const baseDir = utils.getFilepath('plugin');
    const loader = new Loader('plugin');
    loader.loadConfig();

    loader.plugins.g.should.eql({
      enable: true,
      name: 'g',
      dep: [ 'f' ],
      env: [],
      path: path.join(baseDir, 'plugins/g'),
      version: '1.0.0',
    });
  });

  it('如果插件名不一致提示警告', function() {
    let message;
    mm(console, 'warn', function(m) {
      if (!m.startsWith('[egg:loader] eggPlugin is missing') && !message) {
        message = m;
      }
    });
    const loader = new Loader('plugin');
    loader.loadConfig();

    message.should.eql('[egg:loader] pluginName(e) is different from pluginConfigName(wrong-name)');
  });

  it('should loadConfig plugins with custom plugins config', function() {
    const baseDir = utils.getFilepath('plugin');
    const plugins = {
      foo: {
        enable: true,
        path: path.join(baseDir, 'node_modules/d'),
      },
      d1: {
        env: [ 'unittest' ],
      },
    };
    const loader = new Loader('plugin', { plugins });
    loader.loadConfig();

    loader.plugins.d1.should.eql({
      enable: true,
      name: 'd1',
      package: 'd',
      dep: [],
      env: [ 'unittest' ],
      path: path.join(baseDir, 'node_modules/d'),
    });
    loader.plugins.foo.should.eql({
      enable: true,
      name: 'foo',
      dep: [],
      env: [],
      path: path.join(baseDir, 'node_modules/d'),
    });
    should.not.exists(loader.plugins.d);
  });

  it('should custom plugins with EGG_PLUGINS', function() {
    const baseDir = utils.getFilepath('plugin');
    const plugins = {
      b: false,
      h: {
        enable: true,
        path: path.join(baseDir, 'node_modules/h'),
      },
    };
    mm(process.env, 'EGG_PLUGINS', `${JSON.stringify(plugins)}`);
    const loader = new Loader('plugin');
    loader.loadConfig();

    loader.allPlugins.b.enable.should.be.false();
    loader.allPlugins.h.enable.should.be.true();
    loader.allPlugins.h.path.should.eql(path.join(baseDir, 'node_modules/h'));
  });

  it('should ignore when EGG_PLUGINS parse error', function() {
    mm(process.env, 'EGG_PLUGINS', '{h:1}');
    const loader = new Loader('plugin');
    loader.loadConfig();
    should.not.exists(loader.allPlugins.h);
  });

  it('加载不存在的插件，抛异常', function() {
    (function() {
      const loader = new Loader('plugin-noexist');
      loader.loadConfig();
    }).should.throw(/Can not find plugin noexist in /);
  });

  it('当插件依赖的未开启的插件不存在，抛异常', function() {
    (function() {
      const loader = new Loader('no-dep-plugin');
      loader.loadConfig();
    }).should.throw(/Can not find plugin @ali\/b in /);
  });

  it('插件加载保持依赖顺序', function() {
    mm(process.env, 'NODE_ENV', 'development');
    const loader = new Loader('plugin-dep');
    loader.loadConfig();
    loader.orderPlugins.map(function(plugin) {
      return plugin.name;
    }).should.eql([
      'session',
      // 'depd',
      // 'onerror',
      // 'userservice',
      // 'userrole',
      // 'session',
      // 'locals',
      // 'security',
      // 'watcher',
      // 'view',
      // 'i18n',
      // 'validate',
      // 'multipart',
      // 'development',
      // 'logrotater',
      'b',
      'c1',
      'f',
      'a',
      'd',
      'e',
    ]);
  });

  it('插件循环依赖应该报错', function() {
    (function() {
      const loader = new Loader('plugin-dep-recursive');
      loader.loadConfig();
    }).should.throw('sequencify plugins has problem, missing: [], recursive: [a,b,c,a]');
  });

  it('依赖不存在的 key 应该报错', function() {
    (function() {
      const loader = new Loader('plugin-dep-missing');
      loader.loadConfig();
    }).should.throw('sequencify plugins has problem, missing: [a1], recursive: []\n\t>> Plugin [a1] is disabled or missed, but is required by [c]');
  });

  it('依赖未开启的插件应该隐式开启，并且给出提示', done => {
    const logger = {
      info: msg => {
        if (msg.startsWith('[egg:loader] eggPlugin is missing')) {
          return;
        }
        // Following plugins will be enabled implicitly.
        //   - eagleeye required by [hsfclient]
        //   - configclient required by [hsfclient]
        //   - diamond required by [hsfclient]
        msg.should.equal(`Following plugins will be enabled implicitly.\n  - eagleeye required by [hsfclient]\n  - configclient required by [hsfclient]\n  - diamond required by [hsfclient]`);
        done();
      },
    };

    const loader = new Loader('plugin-framework', { logger });
    loader.loadConfig();
    // loader.plugins 应该是都被开启的插件
    for (const name in loader.plugins) {
      loader.plugins[name].enable.should.ok;
    }
  });

  it('app 的 plugin.js 不允许隐式覆盖', () => {
    (function() {
      const loader = new Loader('plugin-dep-disable');
      loader.loadConfig();
    }).should.throw(`sequencify plugins has problem, missing: [b,c], recursive: []\n\t>> Plugin [b] is disabled or missed, but is required by [a,d]\n\t>> Plugin [c] is disabled or missed, but is required by [a]`);
  });

  it('不开启环境条件不符合的插件', function() {
    const loader = new Loader('dont-load-plugin');
    loader.loadConfig();
    should.not.exist(loader.plugins.testMe);
    loader.orderPlugins.map(function(plugin) {
      return plugin.name;
    }).should.not.containEql('testMe');
  });

  it('只开启 type: alipay 的插件', function() {
    // mock local
    mm(process.env, 'NODE_ENV', 'development');
    const loader = new Loader('dont-load-plugin');
    loader.loadConfig();
    const names = loader.orderPlugins.map(function(plugin) {
      return plugin.name;
    });
    names.should.containEql('testMe');
  });

  it('只开启 type: ali 的插件', function() {
    const loader = new Loader('ali-plugin');
    loader.loadConfig();
    const names = loader.orderPlugins.map(function(plugin) {
      return plugin.name;
    });
    names.should.containEql('foo');
  });

  it('可以通过插件内的配置文件补全本插件配置信息', function() {
    const baseDir = utils.getFilepath('plugin');

    mm(process.env, 'NODE_ENV', 'test');
    const loader1 = new Loader('plugin');
    loader1.loadConfig();

    // unittest 环境不开启
    const keys1 = loader1.orderPlugins.map(function(plugin) {
      return plugin.name;
    }).join(',');
    keys1.should.containEql('b,c,d1,f,e');
    should.not.exist(loader1.plugins.a1);

    mm(process.env, 'NODE_ENV', 'development');
    const loader2 = new Loader('plugin');
    loader2.loadConfig();
    const keys2 = loader2.orderPlugins.map(function(plugin) {
      return plugin.name;
    }).join(',');
    keys2.should.containEql('d1,a1,b,c,f,e');
    loader2.plugins.a1.should.eql({
      enable: true,
      name: 'a1',
      dep: [ 'd1' ],
      env: [ 'local', 'prod' ],
      path: path.join(baseDir, 'node_modules/a1'),
    });
  });

  it('支持 customEgg 加载多个 egg 内核', function() {
    const customEgg = utils.getFilepath('custom-framework');
    const loader = new Loader('custom-app', {
      customEgg,
    });
    loader.loadConfig();

    console.log(loader.plugins);
    loader.plugins.foo.should.eql({
      name: 'foo',
      enable: true,
      dep: [],
      env: [],
      path: path.join(customEgg, 'lib/plugins/foo'),
    });

    should.not.exists(loader.plugins.depd);
  });

  it('插件均未开启', function() {
    const loader = new Loader('noplugin');
    loader.loadConfig();
    loader.orderPlugins.length.should.eql(0);
  });

  it('依赖的插件被 env 关闭，应该关闭', function() {
    (function() {
      mm(process.env, 'EGG_SERVER_ENV', 'prod');
      const loader = new Loader('env-disable');
      loader.loadConfig();
    }).should.throw('sequencify plugins has problem, missing: [b], recursive: []\n\t>> Plugin [b] is disabled or missed, but is required by [a]');
  });

  it('插件覆盖时应该只取 path 或 package', function() {
    const loader = new Loader('plugin-path-package');
    loader.loadConfig();
    should.not.exists(loader.plugins.session.package);
    loader.plugins.session.path
      .should.equal(utils.getFilepath('plugin-path-package/session'));
    should.exists(loader.plugins.hsfclient.package);
    loader.plugins.hsfclient.path
      .should.equal(utils.getFilepath('plugin-path-package/node_modules/hsfclient'));
  });
});
