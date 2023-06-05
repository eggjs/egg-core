import path from 'node:path';
import { strict as assert } from 'node:assert';
import mm from 'mm';
import { sleep } from '../utils';
import utils from '../../src/utils';

describe('test/utils/index.test.ts', () => {
  afterEach(mm.restore);

  describe('callFn', () => {
    it('should not call that is not a function', async () => {
      await utils.callFn();
    });

    it('should call function', async () => {
      function fn() { return 1; }
      const result = await utils.callFn(fn);
      assert.equal(result, 1);
    });

    it('should call generator function', async () => {
      function* fn() {
        yield sleep(10);
        return 1;
      }
      const result = await utils.callFn(fn);
      assert.equal(result, 1);
    });

    it('should call return promise function', async () => {
      function fn() {
        return sleep(10).then(() => (1));
      }
      const result = await utils.callFn(fn);
      assert.equal(result, 1);
    });

    it('should call async function', async () => {
      async function fn() {
        await sleep(10);
        return 1;
      }
      const result = await utils.callFn(fn);
      assert.equal(result, 1);
    });

    it('should call with args', async () => {
      async function fn(...args) {
        await sleep(10);
        return args;
      }
      const result = await utils.callFn(fn, [ 1, 2 ]);
      assert.deepEqual(result, [ 1, 2 ]);
    });
  });

  describe('loadFile', () => {
    const baseDir = path.join(__dirname, '../fixtures/loadfile');
    it('should load object', () => {
      const result = utils.loadFile(path.join(baseDir, 'object.js'));
      assert.equal(result.a, 1);
    });

    it('should load null', () => {
      const result = utils.loadFile(path.join(baseDir, 'null.js'));
      assert.equal(result, null);
    });

    it('should load null', () => {
      const result = utils.loadFile(path.join(baseDir, 'zero.js'));
      assert.equal(result, 0);
    });

    it('should load es module', () => {
      const result = utils.loadFile(path.join(baseDir, 'es-module.js'));
      assert(result.fn);
    });

    it('should load es module with default', () => {
      const result = utils.loadFile(path.join(baseDir, 'es-module-default.js'));
      assert(result.fn);
    });

    it('should load es module with default = null', () => {
      const result = utils.loadFile(path.join(baseDir, 'es-module-default-null.js'));
      assert.equal(result, null);
    });

    it('should load no js file', () => {
      let result = utils.loadFile(path.join(baseDir, 'no-js.yml')).toString();
      if (process.platform === 'win32') {
        result = result.replace(/\r\n/g, '\n');
      }
      assert.equal(result, '---\nmap:\n a: 1\n b: 2');
    });
  });
});
