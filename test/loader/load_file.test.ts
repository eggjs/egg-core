import { strict as assert } from 'node:assert';
import mm from 'mm';
import { createApp, Application, getFilepath } from '../helper.js';

describe('test/loader/load_file.test.ts', () => {
  let app: Application;
  afterEach(mm.restore);
  afterEach(() => app.close());

  it('should load file', async () => {
    app = createApp('load_file');
    const exports = await app.loader.loadFile(getFilepath('load_file/obj.js'));
    assert.deepEqual(exports, { a: 1 });
    const exports2 = await app.loader.loadFile(getFilepath('load_file/obj'));
    assert.deepEqual(exports2, { a: 1 });
  });

  it('should load file when exports is function', async () => {
    app = createApp('load_file');
    const exports = await app.loader.loadFile(getFilepath('load_file/function.js'), 1, 2);
    assert.deepEqual(exports, [ 1, 2 ]);
  });

  it('should throw with filepath when file syntax error', async () => {
    await assert.rejects(async () => {
      app = createApp('syntaxerror');
      await app.loader.loadCustomApp();
    }, /error: Unexpected end of input/);
  });

  it('should load custom file', async () => {
    app = createApp('load_file');
    let result = (await app.loader.loadFile(getFilepath('load_file/no-js.yml'))).toString();
    if (process.platform === 'win32') {
      result = result.replace(/\r\n/g, '\n');
    }
    assert.equal(result, '---\nmap:\n a: 1\n b: 2');
  });

  it('should load file which returns async function', async () => {
    app = createApp('load_file');
    const result = (await app.loader.loadFile(getFilepath('load_file/es-module-default-async.yml'))).toString();
    assert.deepEqual(result, { clients: 'Test Config' });
  });
});
