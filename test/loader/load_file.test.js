'use strict';

require('should');
const mm = require('mm');
const utils = require('../utils');

describe('test/load_file.test.js', function() {

  afterEach(mm.restore);

  it('should load file', function() {
    const app = utils.createApp('load_file');
    app.loader.loadFile(utils.getFilepath('load_file/obj.js')).should.eql({ a: 1 });
  });

  it('should load file when exports is function', function() {
    const app = utils.createApp('load_file');
    app.loader.loadFile(utils.getFilepath('load_file/function.js'), 1, 2).should.eql([ 1, 2 ]);
  });

  it('should throw with filepath when file syntax error', function() {
    const filepath = utils.getFilepath('syntaxerror/app.js');
    (function() {
      const app = utils.createApp('syntaxerror');
      app.loader.loadCustomApp();
    }).should.throw(`load file: ${filepath}, error: Unexpected token )`);
  });

});
