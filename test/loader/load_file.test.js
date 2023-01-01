const mm = require('mm');
const assert = require('assert');
const utils = require('../utils');

describe('test/loader/load_file.test.js', () => {
  let app;
  afterEach(mm.restore);
  afterEach(() => app.close());

  it('should load file', () => {
    app = utils.createApp('load_file');
    const exports = app.loader.loadFile(utils.getFilepath('load_file/obj.js'));
    assert.deepEqual(exports, { a: 1 });
  });

  it('should load file when exports is function', () => {
    app = utils.createApp('load_file');
    const exports = app.loader.loadFile(utils.getFilepath('load_file/function.js'), 1, 2);
    assert.deepEqual(exports, [ 1, 2 ]);
  });

  it('should throw with filepath when file syntax error', () => {
    assert.throws(() => {
      app = utils.createApp('syntaxerror');
      app.loader.loadCustomApp();
    }, /error: Unexpected end of input/);
  });

  it('should load custom file', () => {
    app = utils.createApp('load_file');
    let result = app.loader.loadFile(utils.getFilepath('load_file/no-js.yml')).toString();
    if (process.platform === 'win32') {
      result = result.replace(/\r\n/g, '\n');
    }
    assert(result === '---\nmap:\n a: 1\n b: 2');
  });
});
