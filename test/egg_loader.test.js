'use strict';

require('should');
const path = require('path');
const mm = require('mm');
const utils = require('./utils');
const BaseLoader = require('../index');

describe('test/egg_loader.test.js', function() {

  afterEach(mm.restore);

  describe('getServerEnv', function() {

    it('应该来自于环境变量 EGG_SERVER_ENV', function() {
      mm(process.env, 'EGG_SERVER_ENV', 'prod');
      const app = utils.createApp('serverenv');
      app.loader.serverEnv.should.equal('prod');
    });

    it('当 NODE_ENV = test，应该设置默认值 unittest', function() {
      mm(process.env, 'NODE_ENV', 'test');
      const app = utils.createApp('serverenv');
      app.loader.serverEnv.should.equal('unittest');
    });

    it('当 NODE_ENV = production，应该设置默认值 default', function() {
      mm(process.env, 'NODE_ENV', 'production');
      const app = utils.createApp('serverenv');
      app.loader.serverEnv.should.equal('default');
    });

    it('当 NODE_ENV 为其他值，应该设置默认值 local', function() {
      mm(process.env, 'NODE_ENV', 'development');
      const app = utils.createApp('serverenv');
      app.loader.serverEnv.should.equal('local');
    });

    it('应该来自于环境变量 EGG_SERVER_ENV', function() {
      mm(process.env, 'NODE_ENV', 'production');
      mm(process.env, 'EGG_SERVER_ENV', 'test');
      const app = utils.createApp('serverenv-file');
      app.loader.serverEnv.should.equal('prod');
    });
  });


  describe('eggPaths', function() {

    it('应该通过 loader 的参数指定 eggPath', function() {
      const app = utils.createApp('eggpath');
      app.loader.eggPath.should.equal(utils.getFilepath('egg'));
    });

    it('应该解析 egg 和框架的路径', function() {
      const Application = require('./fixtures/framework');
      const app = new Application();
      app.coreLogger = console;
      app.loader = new utils.Loader('eggpath', { app });
      app.loader.loadConfig();
      app.loader.eggPaths.should.eql([
        utils.getFilepath('egg'),
        utils.getFilepath('framework/node_modules/framework2'),
        utils.getFilepath('framework'),
      ]);
      return app;
    });

    it('应该解析 egg 和框架的路径，使用 Symbol.for', function() {
      const Application = require('./fixtures/framework-symbol');
      const app = new Application();
      app.coreLogger = console;
      app.loader = new utils.Loader('eggpath', { app });
      app.loader.loadConfig();
      app.loader.eggPaths.should.eql([
        utils.getFilepath('egg'),
        utils.getFilepath('framework-symbol/node_modules/framework2'),
        utils.getFilepath('framework-symbol'),
      ]);
      return app;
    });

    it('frameworkPaths 不应该包括 eggPath', function() {
      const eggPath = path.join(__dirname, 'fixtures/egg');
      const loader = new BaseLoader({
        baseDir: path.join(__dirname, 'fixtures/eggpath'),
        eggPath,
        customEgg: eggPath,
      });
      loader.frameworkPaths.should.not.containEql(eggPath);
    });
  });


  describe('loadDirs', function() {

    it('默认读取插件', function() {
      const app = utils.createApp('plugin');
      const dirs = app.loader.loadDirs();
      dirs.length.should.eql(10);
    });

    it('应该不读取插件', function() {
      const loader = new utils.Loader('plugin');
      const dirs = loader.loadDirs();
      dirs.length.should.eql(2);
    });
  });


  describe('loadFile', function() {
    it('should throw with filepath when file syntax error', function() {
      (function() {
        utils.createApp('syntaxerror');
      }).should.throw(/test\/fixtures\/syntaxerror\/app\.js error:/);
    });
  });
});
