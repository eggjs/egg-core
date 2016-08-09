'use strict';

require('should');
const mm = require('mm');
const utils = require('../utils');
const Loader = require('../../lib/loader/egg_loader');
const EggApplication = require('../fixtures/egg');

describe('test/get_appname.test.js', function() {

  afterEach(mm.restore);

  it('should get appname', function() {
    const loader = new Loader({
      baseDir: utils.getFilepath('appname'),
      app: new EggApplication(),
      logger: console,
    });
    loader.getAppname().should.eql('appname');
  });

  it('should throw when appname is not found', function() {
    const pkg = utils.getFilepath('app-noname/package.json');
    (function() {
      new Loader({
        baseDir: utils.getFilepath('app-noname'),
        app: new EggApplication(),
        logger: console,
      });
    }).should.throw(`name is required from ${pkg}`);
  });
});
