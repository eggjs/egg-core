'use strict';

require('should');
const mm = require('mm');
const utils = require('./utils');
const Loader = require('../lib/egg_loader');
const EggApplication = require('./fixtures/egg');

describe('test/load_file.test.js', function() {

  afterEach(mm.restore);

  it('should load file', function() {
    const loader = new Loader({
      baseDir: utils.getFilepath('load_file'),
      app: new EggApplication(),
    });
    loader.loadFile(utils.getFilepath('load_file/obj.js')).should.eql({ a: 1 });
  });

  it('should load file when exports is function', function() {
    const loader = new Loader({
      baseDir: utils.getFilepath('load_file'),
      app: new EggApplication(),
    });
    loader.loadFile(utils.getFilepath('load_file/function.js'), 1, 2).should.eql([ 1, 2 ]);
  });

  it('should throw with filepath when file syntax error', function() {
    const filepath = utils.getFilepath('syntaxerror/app.js');
    (function() {
      utils.createApp('syntaxerror');
    }).should.throw(`load file: ${filepath}, error: Unexpected token )`);
  });

});
