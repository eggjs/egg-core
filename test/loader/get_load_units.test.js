'use strict';

const mm = require('mm');
const assert = require('assert');
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
    assert(units.length === 13);
    assert(units[11].type === 'framework');
    assert(units[11].path === utils.getFilepath('egg'));
    assert(units[12].type === 'app');
    assert(units[12].path === utils.getFilepath('plugin'));
  });

  it('should not get plugin dir', function() {
    app = utils.createApp('plugin');
    const units = app.loader.getLoadUnits();
    assert(units.length === 2);
  });
});
