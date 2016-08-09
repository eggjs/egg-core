'use strict';

require('should');
const mm = require('mm');
const utils = require('../utils');
const Loader = require('../../lib/loader/egg_loader');
const EggApplication = require('../fixtures/egg');
const KoaApplication = require('koa');

describe('test/get_framework_paths.test.js', function() {

  afterEach(mm.restore);

  it('should get from paramter', function() {
    const loader = new Loader({
      baseDir: utils.getFilepath('eggpath'),
      app: new EggApplication(),
      logger: console,
    });
    loader.eggPaths.should.eql([ utils.getFilepath('egg') ]);
  });

  it('should get from framework using symbol', function() {
    const Application = require('../fixtures/framework-symbol');
    const loader = new Loader({
      baseDir: utils.getFilepath('eggpath'),
      app: new Application(),
      logger: console,
    });
    loader.eggPaths.should.eql([
      utils.getFilepath('framework-symbol/node_modules/framework2'),
      utils.getFilepath('framework-symbol'),
    ]);
  });

  it('should throw when Application not extends koa', () => {
    class Application {
      get [Symbol.for('egg#eggPath')]() {
        return __dirname;
      }
    }
    (function() {
      new Loader({
        baseDir: utils.getFilepath('eggpath'),
        app: new Application(),
        logger: console,
      });
    }).should.throw('Symbol.for(\'egg#eggPath\') is required on Application');
  });

  it('should throw when one of the Application do not specify symbol', () => {
    class Application extends KoaApplication {}
    class Application2 extends Application {
      get [Symbol.for('egg#eggPath')]() {
        return __dirname;
      }
    }
    (function() {
      new Loader({
        baseDir: utils.getFilepath('eggpath'),
        app: new Application2(),
        logger: console,
      });
    }).should.throw('Symbol.for(\'egg#eggPath\') is required on Application');
  });
});
