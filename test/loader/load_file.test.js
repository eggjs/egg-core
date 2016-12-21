'use strict';

require('should');
const mm = require('mm');
const utils = require('../utils');

describe('test/load_file.test.js', function() {

  let app;
  afterEach(mm.restore);
  afterEach(() => app.close());

  it('should load file', function() {
    app = utils.createApp('load_file');
    app.loader.loadFile(utils.getFilepath('load_file/obj.js')).should.eql({ a: 1 });
  });

  it('should load file when exports is function', function() {
    app = utils.createApp('load_file');
    app.loader.loadFile(utils.getFilepath('load_file/function.js'), 1, 2).should.eql([ 1, 2 ]);
  });

  it('should throw with filepath when file syntax error', function() {
    (function() {
      app = utils.createApp('syntaxerror');
      app.loader.loadCustomApp();
    }).should.throw(/Parse Error: Unexpected token/);
  });

});
