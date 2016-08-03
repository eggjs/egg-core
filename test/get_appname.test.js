'use strict';

require('should');
const mm = require('mm');
const utils = require('./utils');
const Loader = require('../lib/base_loader');
const EggApplication = require('./fixtures/egg');

describe('test/get_appname.test.js', function() {

  afterEach(mm.restore);

  it('should get appname', function() {
    const loader = new Loader({
      baseDir: utils.getFilepath('appname'),
      app: new EggApplication(),
    });
    loader.getAppname().should.eql('appname');
  });

  it('should throw when appname is not found', function() {
    const loader = new Loader({
      baseDir: utils.getFilepath('app-noname'),
      app: new EggApplication(),
    });
    const pkg = utils.getFilepath('app-noname/package.json');
    (function() {
      loader.getAppname();
    }).should.throw(`name is required from ${pkg}`);
  });
});
