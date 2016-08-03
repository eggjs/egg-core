'use strict';

require('should');
const mm = require('mm');
const utils = require('./utils');
const Loader = require('../lib/base_loader');
const EggApplication = require('./fixtures/egg');

describe('test/get_load_units.test.js', function() {

  afterEach(mm.restore);

  it('should get plugin dir', function() {
    const loader = new Loader({
      baseDir: utils.getFilepath('plugin'),
      app: new EggApplication(),
    });
    loader.loadPlugin();
    const units = loader.getLoadUnits();
    units.length.should.eql(10);
    units[8].type.should.eql('framework');
    units[8].path.should.eql(utils.getFilepath('egg/lib/core'));
    units[9].type.should.eql('app');
    units[9].path.should.eql(utils.getFilepath('plugin'));
  });

  it('should not get plugin dir', function() {
    const loader = new Loader({
      baseDir: utils.getFilepath('plugin'),
      app: new EggApplication(),
    });
    const units = loader.getLoadUnits();
    units.length.should.eql(2);
  });

});
