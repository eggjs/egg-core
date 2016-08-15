'use strict';

require('should');
const mm = require('mm');
const utils = require('../utils');

describe('test/loader/get_appname.test.js', function() {

  let app;
  afterEach(mm.restore);
  afterEach(() => app && app.close());

  it('should get appname', function() {
    app = utils.createApp('appname');
    app.loader.getAppname().should.equal('appname');
  });

  it('should throw when appname is not found', function() {
    const pkg = utils.getFilepath('app-noname/package.json');
    (function() {
      utils.createApp('app-noname');
    }).should.throw(`name is required from ${pkg}`);
  });
});
