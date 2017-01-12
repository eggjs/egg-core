'use strict';

const mm = require('mm');
const assert = require('assert');
const utils = require('../utils');

describe('test/loader/get_appname.test.js', () => {

  let app;
  afterEach(mm.restore);
  afterEach(() => app && app.close());

  it('should get appname', () => {
    app = utils.createApp('appname');
    assert(app.loader.getAppname() === 'appname');
  });

  it('should throw when appname is not found', done => {
    const pkg = utils.getFilepath('app-noname/package.json');
    try {
      utils.createApp('app-noname');
    } catch (err) {
      assert(err.message.indexOf(`name is required from ${pkg}`) >= 0);
      done();
    }
  });
});
