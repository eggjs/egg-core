'use strict';

const mm = require('mm');
const assert = require('assert');
const utils = require('../utils');
const EggLoader = require('../..').EggLoader;

class Application {
  constructor() {
    this.loader = new EggLoader({
      baseDir: utils.getFilepath('eggpath'),
      app: this,
      logger: console,
    });
  }
  get [Symbol.for('egg#eggPath')]() {
    return utils.getFilepath('egg');
  }
  close() {}
}

describe('test/loader/get_framework_paths.test.js', function() {
  let app;
  afterEach(mm.restore);
  afterEach(() => app && app.close());

  it('should get from paramter', function() {
    app = utils.createApp('eggpath');
    assert.deepEqual(app.loader.eggPaths, [ utils.getFilepath('egg') ]);
  });

  it('should get from framework using symbol', function() {
    app = utils.createApp('eggpath', {
      Application: require(utils.getFilepath('framework-symbol')),
    });
    assert.deepEqual(app.loader.eggPaths, [
      utils.getFilepath('egg'),
      utils.getFilepath('framework-symbol/node_modules/framework2'),
      utils.getFilepath('framework-symbol'),
    ]);
  });

  it('should throw when one of the Application do not specify symbol', () => {
    assert.throws(() => {
      utils.createApp('eggpath', {
        Application: require(utils.getFilepath('framework-nosymbol')),
      });
    }, /Symbol.for\('egg#eggPath'\) is required on Application/);
  });

  it('should remove dulplicate eggPath', () => {
    app = utils.createApp('eggpath', {
      Application: require(utils.getFilepath('framework-dulp')),
    });
    assert.deepEqual(app.loader.eggPaths, [
      utils.getFilepath('egg'),
      utils.getFilepath('framework-dulp'),
    ]);
  });

  it('should when Application do not extend EggCore', () => {
    app = utils.createApp('eggpath', {
      Application,
    });
    assert(app.loader.eggPaths.length === 1);
    assert(app.loader.eggPaths[0] === utils.getFilepath('egg'));
  });

  it('should assert eggPath type', () => {
    assert.throws(() => {
      utils.createApp('eggpath', {
        Application: require(utils.getFilepath('framework-wrong-eggpath')),
      });
    }, /Symbol.for\('egg#eggPath'\) should be string/);
  });
});
