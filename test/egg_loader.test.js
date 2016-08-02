'use strict';

require('should');
const path = require('path');
const mm = require('mm');
const utils = require('./utils');
const BaseLoader = require('../index');

describe('test/egg_loader.test.js', function() {

  afterEach(mm.restore);

  describe('eggPaths', function() {

    it('should get from paramter', function() {
      const app = utils.createApp('eggpath');
      app.loader.eggPath.should.equal(utils.getFilepath('egg'));
    });

    it('should get from framework', function() {
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

    it('should get from framework using symbol', function() {
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

    it('frameworkPaths should not container eggPath', function() {
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

    it('should get plugin dir', function() {
      const app = utils.createApp('plugin');
      const dirs = app.loader.loadDirs();
      dirs.length.should.eql(10);
    });

    it('should not get plugin dir', function() {
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
