'use strict';

const mm = require('mm');
const assert = require('assert');
const utils = require('../utils');

describe('test/load_file.test.js', function() {
  let app;
  afterEach(mm.restore);
  afterEach(() => app.close());

  it('should load file', function() {
    app = utils.createApp('load_file');
    const exports = app.loader.loadFile(utils.getFilepath('load_file/obj.js'));
    assert.deepEqual(exports, { a: 1 });
  });

  it('should load file when exports is function', function() {
    app = utils.createApp('load_file');
    const exports = app.loader.loadFile(utils.getFilepath('load_file/function.js'), 1, 2);
    assert.deepEqual(exports, [ 1, 2 ]);
  });

  it('should throw with filepath when file syntax error', function() {
    assert.throws(() => {
      app = utils.createApp('syntaxerror');
      app.loader.loadCustomApp();
    }, /Parse Error: Unexpected token/);
  });

  it('should load custom file', function() {
    app = utils.createApp('load_file');
    const result = app.loader.loadFile(utils.getFilepath('load_file/no-js.yml')).toString();
    assert(result === '---\nmap:\n a: 1\n b: 2');
  });
});
