'use strict';

require('should');
const mm = require('mm');
const utils = require('./utils');

describe('test/egg_loader.test.js', function() {

  afterEach(mm.restore);


  describe('loadDirs', function() {

    it('should get plugin dir', function() {
      const app = utils.createApp('plugin');
      const dirs = app.loader.loadDirs();
      dirs.length.should.eql(10);
    });

    it('should not get plugin dir', function() {
      const loader = new utils.Loader('plugin');
      const dirs = loader.loadDirs();
      dirs.length.should.eql(2);
    });
  });

});
