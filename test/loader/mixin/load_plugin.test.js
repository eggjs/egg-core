'use strict';

const path = require('path');
const fs = require('fs');
const mm = require('mm');
const assert = require('assert');
const rimraf = require('rimraf');
const spy = require('spy');
const pedding = require('pedding');
const utils = require('../../utils');
const EggCore = require('../../..').EggCore;
const EggLoader = require('../../..').EggLoader;


describe('test/load_plugin.test.js', function() {
  let app;

  afterEach(() => {
    mm.restore();
    app && app.close();
    app = null;
  });

  it('should exports allPlugins, appPlugins, customPlugins, eggPlugins', () => {
    app = utils.createApp('plugin');
    const loader = app.loader;
    loader.loadPlugin();
    assert('allPlugins' in loader);
    assert('appPlugins' in loader);
    assert('customPlugins' in loader);
    assert('eggPlugins' in loader);
  });

  it('should loadConfig all plugins', function() {
    const baseDir = utils.getFilepath('plugin');
    app = utils.createApp('plugin');
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();
    assert.deepEqual(loader.plugins.b, {
      enable: true,
      name: 'b',
      dependencies: [],
      optionalDependencies: [],
      env: [],
      path: path.join(baseDir, 'node_modules/b'),
      from: path.join(baseDir, 'config/plugin.js'),
    });
    assert.deepEqual(loader.plugins.c, {
      enable: true,
      name: 'c',
      dependencies: [],
      optionalDependencies: [],
      env: [],
      path: path.join(baseDir, 'node_modules/c'),
      from: path.join(baseDir, 'config/plugin.js'),
    });
    assert.deepEqual(loader.plugins.e, {
      enable: true,
      name: 'e',
      dependencies: [ 'f' ],
      optionalDependencies: [],
      env: [],
      path: path.join(baseDir, 'plugins/e'),
      from: path.join(baseDir, 'config/plugin.js'),
    });
    assert(loader.orderPlugins instanceof Array);
  });

  it('should loadPlugin with order', function() {
    app = utils.createApp('plugin');
    const loader = app.loader;
    const loaderOrders = [];
    [
      'loadAppPlugins',
      'loadEggPlugins',
      'loadCustomPlugins',
    ].forEach(method => {
      mm(loader, method, () => {
        loaderOrders.push(method);
        return {};
      });
    });

    loader.loadPlugin();
    assert.deepEqual(loaderOrders, [
      'loadEggPlugins',
      'loadAppPlugins',
      'loadCustomPlugins',
    ]);
  });

  it('should follow the search order，node_modules of application > node_modules of framework', function() {
    const baseDir = utils.getFilepath('plugin');
    app = utils.createApp('plugin');
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();

    assert.deepEqual(loader.plugins.rds, {
      enable: true,
      name: 'rds',
      dependencies: [ 'session' ],
      optionalDependencies: [],
      env: [],
      package: 'rds',
      path: path.join(baseDir, 'node_modules/rds'),
      from: path.join(baseDir, 'config/plugin.js'),
    });
  });

  it('should support pnpm node_modules style', () => {
    class Application extends EggCore {
      get [Symbol.for('egg#loader')]() {
        return EggLoader;
      }
      get [Symbol.for('egg#eggPath')]() {
        return utils.getFilepath('plugin-pnpm/node_modules/.pnpm/framework@1.0.0/node_modules/framework');
      }
    }
    app = utils.createApp('plugin-pnpm', {
      Application,
    });
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();
    // console.log(loader.plugins, loader.config);
    assert(loader.plugins.a);
    assert(loader.plugins.b);
    assert(loader.config.a === 'a');
    assert(loader.config.b === 'b');
  });

  it('should support pnpm node_modules style with scope', () => {
    class Application extends EggCore {
      get [Symbol.for('egg#loader')]() {
        return EggLoader;
      }
      get [Symbol.for('egg#eggPath')]() {
        return utils.getFilepath('plugin-pnpm-scope/node_modules/.pnpm/@eggjs+yadan@1.0.0/node_modules/@eggjs/yadan');
      }
    }
    app = utils.createApp('plugin-pnpm-scope', {
      Application,
    });
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();
    // console.log(loader.plugins, loader.config);
    assert(loader.plugins.a);
    assert(loader.plugins.b);
    assert(loader.config.a === 'a');
    assert(loader.config.b === 'b');
  });

  it('should support alias', function() {
    const baseDir = utils.getFilepath('plugin');
    app = utils.createApp('plugin');
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();

    assert.deepEqual(loader.plugins.d1, {
      enable: true,
      name: 'd1',
      package: 'd',
      dependencies: [],
      optionalDependencies: [],
      env: [],
      path: path.join(baseDir, 'node_modules/d'),
      from: path.join(baseDir, 'config/plugin.js'),
    });
    assert(!loader.plugins.d);
  });

  it('should support config in package.json', function() {
    const baseDir = utils.getFilepath('plugin');
    app = utils.createApp('plugin');
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();

    assert.deepEqual(loader.plugins.g, {
      enable: true,
      name: 'g',
      dependencies: [ 'f' ],
      optionalDependencies: [],
      env: [],
      path: path.join(baseDir, 'plugins/g'),
      version: '1.0.0',
      from: path.join(baseDir, 'config/plugin.js'),
    });
  });

  it('should warn when the name of plugin is not same', function() {
    let message;
    app = utils.createApp('plugin');
    mm(app.console, 'warn', function(m) {
      if (!m.startsWith('[egg:loader] eggPlugin is missing') && !message) {
        message = m;
      }
    });
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();

    assert(message === '[egg:loader] pluginName(e) is different from pluginConfigName(wrong-name)');
  });

  it('should not warn when the config.strict is false', function() {
    let message;
    app = utils.createApp('plugin-strict');
    mm(app.console, 'warn', function(m) {
      message = m;
    });
    const loader = app.loader;
    loader.loadPlugin();
    assert(!message);
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
    app = utils.createApp('plugin', { plugins });
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();

    assert.deepEqual(loader.plugins.d1, {
      enable: true,
      name: 'd1',
      package: 'd',
      dependencies: [],
      optionalDependencies: [],
      env: [ 'unittest' ],
      path: path.join(baseDir, 'node_modules/d'),
      from: path.join(baseDir, 'config/plugin.js'),
    });
    assert.deepEqual(loader.plugins.foo, {
      enable: true,
      name: 'foo',
      dependencies: [],
      optionalDependencies: [],
      env: [],
      path: path.join(baseDir, 'node_modules/d'),
    });
    assert(!loader.plugins.d);
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
    app = utils.createApp('plugin');
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();

    assert(loader.allPlugins.b.enable === false);
    assert(loader.allPlugins.h.enable === true);
    assert(loader.allPlugins.h.path === path.join(baseDir, 'node_modules/h'));
  });

  it('should ignore when EGG_PLUGINS parse error', function() {
    mm(process.env, 'EGG_PLUGINS', '{h:1}');
    app = utils.createApp('plugin');
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();
    assert(!loader.allPlugins.h);
  });

  it('should validate plugin.package', function() {
    assert.throws(() => {
      app = utils.createApp('plugin', { plugins: { foo: { package: '../' }, bar: { package: 'c:\\' } } });
      const loader = app.loader;
      loader.loadPlugin();
      loader.loadConfig();
    }, /plugin foo invalid, use 'path' instead of package/);

    assert.throws(() => {
      app = utils.createApp('plugin', { plugins: { foo: { package: 'c:\\' } } });
      const loader = app.loader;
      loader.loadPlugin();
      loader.loadConfig();
    }, /plugin foo invalid, use 'path' instead of package/);

    assert.throws(() => {
      app = utils.createApp('plugin', { plugins: { foo: { package: '/home' } } });
      const loader = app.loader;
      loader.loadPlugin();
      loader.loadConfig();
    }, /plugin foo invalid, use 'path' instead of package/);
  });

  it('should throw when plugin not exist', function() {
    assert.throws(() => {
      app = utils.createApp('plugin-noexist');
      const loader = app.loader;
      loader.loadPlugin();
      loader.loadConfig();
    }, /Can not find plugin noexist in /);
  });

  it('should throw when the dependent plugin is disabled', function() {
    assert.throws(() => {
      app = utils.createApp('no-dep-plugin');
      const loader = app.loader;
      loader.loadPlugin();
      loader.loadConfig();
    }, /Can not find plugin @ali\/b in /);
  });

  it('should make order', function() {
    mm(process.env, 'NODE_ENV', 'development');
    app = utils.createApp('plugin-dep');
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();
    assert.deepEqual(loader.orderPlugins.map(function(plugin) {
      return plugin.name;
    }), [
      'session',
      'zzz',
      'package',
      'b',
      'c1',
      'f',
      'a',
      'd',
      'e',
    ]);
  });

  it('should throw when plugin is recursive', function() {
    assert.throws(() => {
      app = utils.createApp('plugin-dep-recursive');
      const loader = app.loader;
      loader.loadPlugin();
      loader.loadConfig();
    }, /sequencify plugins has problem, missing: \[], recursive: \[a,b,c,a]/);
  });

  it('should throw when the dependent plugin not exist', function() {
    assert.throws(() => {
      app = utils.createApp('plugin-dep-missing');
      const loader = app.loader;
      loader.loadPlugin();
      loader.loadConfig();
    }, /sequencify plugins has problem, missing: \[a1], recursive: \[]\n\t>> Plugin \[a1] is disabled or missed, but is required by \[c]/);
  });

  it('should log when enable plugin implicitly', done => {
    app = utils.createApp('plugin-framework');
    mm(app.console, 'info', msg => {
      if (msg.startsWith('[egg:loader] eggPlugin is missing')) {
        return;
      }
      // Following plugins will be enabled implicitly.
      //   - eagleeye required by [hsfclient]
      //   - configclient required by [hsfclient]
      //   - diamond required by [hsfclient]
      assert(msg === 'Following plugins will be enabled implicitly.\n  - eagleeye required by [hsfclient]\n  - configclient required by [hsfclient]\n  - diamond required by [hsfclient]');
      done();
    });
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();
    // assert.deepEqual(loader.plugins 应该是都被开启的插件
    for (const name in loader.plugins) {
      assert(loader.plugins[name].enable === true);
    }
  });

  it('should enable dependencies implicitly but not optionalDependencies', done => {
    class Application extends EggCore {
      get [Symbol.for('egg#eggPath')]() {
        return utils.getFilepath('plugin-dep-disable/framework');
      }
    }

    done = pedding(done, 2);
    app = utils.createApp('plugin-dep-disable', {
      Application,
    });
    mm(app.console, 'info', msg => {
      if (msg.startsWith('[egg:loader] eggPlugin is missing')) {
        done(new Error('should no run here'));
        return;
      }
      assert(msg === 'Following plugins will be enabled implicitly.\n  - b required by [a,d]\n  - e required by [c]\n  - c required by [a]');
      done();
    });
    mm(app.console, 'warn', msg => {
      assert(msg === 'Following plugins will be enabled implicitly that is disabled by application.\n  - e required by [c]');
      done();
    });
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();
    assert(loader.plugins.a && loader.plugins.a.enable);
    assert(loader.plugins.b && loader.plugins.b.enable);
    assert(loader.plugins.d && loader.plugins.d.enable);
    assert(!loader.plugins.c);
    assert(!loader.plugins.e);
  });

  it('should enable when not match env', function() {
    app = utils.createApp('dont-load-plugin');
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();
    assert(!loader.plugins.testMe);
    const plugins = loader.orderPlugins.map(function(plugin) {
      return plugin.name;
    });
    assert(!plugins.includes('testMe'));
  });

  it('should complement infomation by config/plugin.js from plugin', function() {
    const baseDir = utils.getFilepath('plugin');

    mm(process.env, 'NODE_ENV', 'test');
    const app1 = utils.createApp('plugin');
    const loader1 = app1.loader;
    loader1.loadPlugin();
    loader1.loadConfig();

    // unittest 环境不开启
    const keys1 = loader1.orderPlugins.map(function(plugin) {
      return plugin.name;
    }).join(',');
    assert(keys1.includes('b,c,d1,f,e'));
    assert(!loader1.plugins.a1);

    mm(process.env, 'NODE_ENV', 'development');
    const app2 = utils.createApp('plugin');
    const loader2 = app2.loader;
    loader2.loadPlugin();
    loader2.loadConfig();
    const keys2 = loader2.orderPlugins.map(function(plugin) {
      return plugin.name;
    }).join(',');
    assert(keys2.includes('d1,a1,b,c,f,e'));
    assert.deepEqual(loader2.plugins.a1, {
      enable: true,
      name: 'a1',
      dependencies: [ 'd1' ],
      optionalDependencies: [],
      env: [ 'local', 'prod' ],
      path: path.join(baseDir, 'node_modules/a1'),
      from: path.join(baseDir, 'config/plugin.js'),
    });
  });

  it('should load when all plugins are disabled', function() {
    app = utils.createApp('noplugin');
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();
    assert(loader.orderPlugins.length === 0);
  });

  it('should throw when the dependent plugin is disabled', function() {
    assert.throws(() => {
      mm(process.env, 'EGG_SERVER_ENV', 'prod');
      app = utils.createApp('env-disable');
      const loader = app.loader;
      loader.loadPlugin();
      loader.loadConfig();
    }, /sequencify plugins has problem, missing: \[b], recursive: \[]\n\t>> Plugin \[b] is disabled or missed, but is required by \[a]/);
  });

  it('should pick path or package when override config', function() {
    app = utils.createApp('plugin-path-package');
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();
    assert(!loader.plugins.session.package);
    assert(loader.plugins.session.path === utils.getFilepath('plugin-path-package/session'));
    assert(loader.plugins.hsfclient.package);
    assert(loader.plugins.hsfclient.path === utils.getFilepath('plugin-path-package/node_modules/hsfclient'));
  });

  it('should resolve the realpath of plugin path', () => {
    rimraf.sync(utils.getFilepath('realpath/node_modules/a'));
    fs.symlinkSync('../a', utils.getFilepath('realpath/node_modules/a'), 'dir');
    app = utils.createApp('realpath');
    const loader = app.loader;
    loader.loadPlugin();
    const plugin = loader.plugins.a;
    assert(plugin.name === 'a');
    assert(plugin.path === utils.getFilepath('realpath/a'));
  });

  it('should get the defining plugin path in every plugin', () => {
    class Application extends EggCore {
      get [ Symbol.for('egg#loader') ]() {
        return EggLoader;
      }
      get [ Symbol.for('egg#eggPath') ]() {
        return utils.getFilepath('plugin-from/framework');
      }
    }
    app = utils.createApp('plugin-from', {
      Application,
    });
    const loader = app.loader;
    loader.loadPlugin();
    assert(loader.plugins.a.from === utils.getFilepath('plugin-from/config/plugin.js'));
    assert(loader.plugins.b.from === utils.getFilepath('plugin-from/framework/config/plugin.js'));
  });

  it('should load plugin.unittest.js override default', function() {
    mm(process.env, 'EGG_SERVER_ENV', 'unittest');
    app = utils.createApp('load-plugin-by-env');
    const loader = app.loader;
    loader.loadPlugin();
    assert(loader.allPlugins.a.enable === false);
    assert(loader.allPlugins.b.enable === true);
  });

  it('should load plugin.custom.js when env is custom', function() {
    mm(process.env, 'EGG_SERVER_ENV', 'custom');
    app = utils.createApp('load-plugin-by-env');
    const loader = app.loader;
    loader.loadPlugin();
    assert(loader.allPlugins.a.enable === true);
    assert(!loader.allPlugins.b);
    assert(loader.allPlugins.c.enable === true);
  });

  it('should not load plugin.js when plugin.default.js exist', function() {
    mm(process.env, 'EGG_SERVER_ENV', 'unittest');
    app = utils.createApp('load-plugin-default');
    const loader = app.loader;
    loader.loadPlugin();
    assert(!loader.allPlugins.a);
    assert(loader.allPlugins.b.enable === true);
    assert(loader.allPlugins.c.enable === true);
  });

  it('should warn when redefine plugin', () => {
    app = utils.createApp('load-plugin-config-override');
    mm(app.console, 'warn', function(msg, name, targetPlugin, from) {
      assert(msg === 'plugin %s has been defined that is %j, but you define again in %s');
      assert(name === 'zzz');
      assert.deepEqual(targetPlugin, {
        enable: true,
        path: utils.getFilepath('egg/plugins/zzz'),
        name: 'zzz',
        dependencies: [],
        optionalDependencies: [],
        env: [],
        from: utils.getFilepath('egg/config/plugin.js'),
      });
      assert(from === utils.getFilepath('load-plugin-config-override/config/plugin.js'));
    });
    const loader = app.loader;
    loader.loadPlugin();
    assert(loader.allPlugins.zzz.path === utils.getFilepath('load-plugin-config-override/plugins/zzz'));
  });

  it('should support optionalDependencies', () => {
    app = utils.createApp('plugin-optional-dependencies');
    const loader = app.loader;
    loader.loadPlugin();
    assert.deepEqual(loader.orderPlugins.slice(2).map(p => p.name), [ 'package', 'e', 'b', 'a', 'f' ]);
  });

  it('should warn when redefine plugin', () => {
    app = utils.createApp('redefine-plugin');
    const warn = spy();
    mm(app.console, 'warn', warn);
    app.loader.loadPlugin();
    assert(warn.callCount === 1);
    assert(warn.calls[0].arguments[0], 'plugin %s has been defined that is %j, but you define again in %s');
  });

  it('should not warn when not redefine plugin', () => {
    mm(process.env, 'EGG_SERVER_ENV', 'default');
    app = utils.createApp('no-redefine-plugin');
    const warn = spy();
    mm(app.console, 'warn', warn);
    app.loader.loadPlugin();
    assert(warn.callCount === 0);
  });

  it('should parse complex dependencies', () => {
    class Application extends EggCore {
      get [Symbol.for('egg#eggPath')]() {
        return utils.getFilepath('plugin-complex-dependencies');
      }
    }
    app = utils.createApp('plugin-complex-dependencies', {
      // use clean framework
      Application,
    });
    const loader = app.loader;
    loader.loadPlugin();
    assert.deepEqual(loader.orderPlugins.map(p => p.name), [
      'zookeeper',
      'ddcs',
      'vip',
      'zoneclient',
      'rpc',
      'ldc',
    ]);
  });

  it('should parse implicitly enable dependencies', () => {
    class Application extends EggCore {
      get [Symbol.for('egg#eggPath')]() {
        return utils.getFilepath('plugin-implicit-enable-dependencies');
      }
    }
    app = utils.createApp('plugin-implicit-enable-dependencies', {
      // use clean framework
      Application,
    });
    const loader = app.loader;
    loader.loadPlugin();
    assert.deepEqual(loader.orderPlugins.map(p => p.name), [
      'zoneclient',
      'ldc',
      'rpcServer',
      'tracelog',
      'gateway',
    ]);
  });

  it('should load plugin from scope', () => {
    mm(process.env, 'EGG_SERVER_SCOPE', 'en');
    app = utils.createApp('scope');
    const loader = app.loader;
    loader.loadPlugin();
    assert(loader.allPlugins.a.enable === false);
  });

  it('should load plugin from scope and default env', () => {
    mm(process.env, 'EGG_SERVER_ENV', 'default');
    mm(process.env, 'EGG_SERVER_SCOPE', 'en');
    app = utils.createApp('scope-env');
    const loader = app.loader;
    loader.loadPlugin();
    assert(loader.allPlugins.a.enable === false);
    assert(loader.allPlugins.b.enable === true);
    assert(!loader.allPlugins.c);
    assert(!loader.allPlugins.d);
  });

  it('should load plugin from scope and prod env', () => {
    mm(process.env, 'EGG_SERVER_ENV', 'prod');
    mm(process.env, 'EGG_SERVER_SCOPE', 'en');
    app = utils.createApp('scope-env');
    const loader = app.loader;
    loader.loadPlugin();
    assert(loader.allPlugins.a.enable === false);
    assert(loader.allPlugins.b.enable === false);
    assert(loader.allPlugins.c.enable === false);
    assert(loader.allPlugins.d.enable === true);
  });

  it('should not load optionalDependencies and their dependencies', () => {
    mm(process.env, 'EGG_SERVER_ENV', 'default');
    app = utils.createApp('plugin-complex-deps');
    const loader = app.loader;
    loader.loadPlugin();
    assert(loader.allPlugins.tracelog.enable === true);
    assert(loader.allPlugins.gw.enable === false);
    assert(loader.allPlugins.rpcServer.enable === false);
  });

  it('should load plugin with duplicate plugin dir from eggPaths', () => {
    class BaseApplication extends EggCore {
      get [Symbol.for('egg#loader')]() {
        return EggLoader;
      }
      get [Symbol.for('egg#eggPath')]() {
        return utils.getFilepath(path.join('plugin-duplicate'));
      }
    }

    class Application extends BaseApplication {
      get [Symbol.for('egg#loader')]() {
        return EggLoader;
      }
      get [Symbol.for('egg#eggPath')]() {
        return utils.getFilepath(path.join('plugin-duplicate', 'node_modules', '@scope', 'b'));
      }
    }

    const baseDir = utils.getFilepath('plugin-duplicate');
    app = utils.createApp(path.join('plugin-duplicate', 'release'), {
      Application,
    });
    const loader = app.loader;
    loader.loadPlugin();
    loader.loadConfig();

    assert.deepEqual(loader.plugins['a-duplicate'], {
      enable: true,
      name: 'a-duplicate',
      dependencies: [],
      optionalDependencies: [ 'a' ],
      env: [],
      package: '@scope/a',
      path: path.join(baseDir, 'node_modules', '@scope', 'a'),
      from: path.join(baseDir, 'release', 'config', 'plugin.js'),
    });
  });
});
