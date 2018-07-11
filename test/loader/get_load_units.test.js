'use strict';

const mm = require('mm');
const assert = require('assert');
const utils = require('../utils');

describe('test/get_load_units.test.js', function() {
  let app;
  afterEach(mm.restore);
  afterEach(() => app.close());

  it('should get plugin dir', function() {
    app = utils.createApp('plugin', {
      Application: require(utils.getFilepath('framework-compatible')),
    });

    app.loader.loadPlugin();
    // delete cache
    delete app.loader.dirs;
    const units = app.loader.getLoadUnits();
    assert(units.length === 13);
    assert(units[2].type === 'plugin');
    assert(units[2].name === 'package');
    assert(units[10].type === 'framework');
    assert(units[10].path === utils.getFilepath('egg'));
    assert(units[10].name === 'egg');
    assert(units[11].type === 'framework');
    assert(units[11].name === undefined);
    assert(units[12].type === 'app');
    assert(units[12].path === utils.getFilepath('plugin'));
    assert(units[12].name === 'plugin');
  });

  it('should not get plugin dir', function() {
    app = utils.createApp('plugin');
    const units = app.loader.getLoadUnits();
    assert(units.length === 2);
  });
});
