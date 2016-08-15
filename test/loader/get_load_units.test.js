'use strict';

require('should');
const mm = require('mm');
const utils = require('../utils');

describe('test/get_load_units.test.js', function() {

  let app;
  afterEach(mm.restore);
  afterEach(() => app.close());

  it('should get plugin dir', function() {
    app = utils.createApp('plugin');
    app.loader.loadPlugin();
    // delete cache
    delete app.loader.dirs;
    const units = app.loader.getLoadUnits();
    units.length.should.eql(10);
    units[8].type.should.eql('framework');
    units[8].path.should.eql(utils.getFilepath('egg'));
    units[9].type.should.eql('app');
    units[9].path.should.eql(utils.getFilepath('plugin'));
  });

  it('should not get plugin dir', function() {
    app = utils.createApp('plugin');
    const units = app.loader.getLoadUnits();
    units.length.should.eql(2);
  });

});
