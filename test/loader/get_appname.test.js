'use strict';

const mm = require('mm');
const assert = require('assert');
const utils = require('../utils');

describe('test/loader/get_appname.test.js', function() {

  let app;
  afterEach(mm.restore);
  afterEach(() => app && app.close());

  it('should get appname', function() {
    app = utils.createApp('appname');
    assert(app.loader.getAppname() === 'appname');
  });

  it('should throw when appname is not found', function() {
    const pkg = utils.getFilepath('app-noname/package.json');
    assert.throws(() => {
      utils.createApp('app-noname');
    }, new RegExp(`name is required from ${pkg}`));
  });
});
