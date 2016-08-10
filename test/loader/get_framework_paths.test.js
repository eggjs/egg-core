'use strict';

require('should');
const mm = require('mm');
const utils = require('../utils');

describe('test/loader/get_framework_paths.test.js', function() {

  let app;
  afterEach(mm.restore);
  afterEach(() => app && app.close());

  it('should get from paramter', function() {
    app = utils.createApp('eggpath');
    app.loader.eggPaths.should.eql([ utils.getFilepath('egg') ]);
  });

  it('should get from framework using symbol', function() {
    app = utils.createApp('eggpath', {
      Application: require(utils.getFilepath('framework-symbol')),
    });
    app.loader.eggPaths.should.eql([
      utils.getFilepath('egg'),
      utils.getFilepath('framework-symbol/node_modules/framework2'),
      utils.getFilepath('framework-symbol'),
    ]);
  });

  it('should throw when one of the Application do not specify symbol', () => {
    (function() {
      utils.createApp('eggpath', {
        Application: require(utils.getFilepath('framework-nosymbol')),
      });
    }).should.throw('Symbol.for(\'egg#eggPath\') is required on Application');
  });
});
