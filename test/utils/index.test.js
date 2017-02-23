'use strict';

const mm = require('mm');
const os = require('os');
const path = require('path');
const assert = require('assert');
const sleep = require('mz-modules/sleep');
const utils = require('../../lib/utils');

describe('test/utils/index.test.js', () => {

  afterEach(mm.restore);

  describe('utils.getHomedir()', () => {
    it('should return process.env.HOME', () => {
      if (os.userInfo && os.userInfo().homedir) {
        const userInfo = os.userInfo();
        delete userInfo.homedir;
        mm(os, 'userInfo', () => userInfo);
      }
      assert(utils.getHomedir() === process.env.HOME);
    });

    it('should return /home/admin when process.env.HOME is not exist', () => {
      mm(process.env, 'HOME', '');
      mm(os, 'userInfo', null);
      mm(os, 'homedir', null);
      assert(utils.getHomedir() === '/home/admin');
    });

    it('should return when EGG_HOME exists', () => {
      mm(process.env, 'EGG_HOME', '/path/to/home');
      assert(utils.getHomedir() === '/path/to/home');
    });
  });

  describe('callFn', () => {

    it('should not call that is not a function', function* () {
      yield utils.callFn();
    });

    it('should call function', function* () {
      function fn() { return 1; }
      const result = yield utils.callFn(fn);
      assert(result === 1);
    });

    it('should call generator function', function* () {
      function* fn() {
        yield sleep(10);
        return 1;
      }
      const result = yield utils.callFn(fn);
      assert(result === 1);
    });

    it('should call async function', function* () {
      function fn() {
        return sleep(10).then(() => (1));
      }
      const result = yield utils.callFn(fn);
      assert(result === 1);
    });

    it('should call with args', function* () {
      function* fn(...args) {
        yield sleep(10);
        return args;
      }
      const result = yield utils.callFn(fn, [ 1, 2 ]);
      assert.deepEqual(result, [ 1, 2 ]);
    });
  });

  describe('loadFile', () => {
    const baseDir = path.join(__dirname, '../fixtures/loadfile');
    it('should load object', () => {
      const result = utils.loadFile(path.join(baseDir, 'object.js'));
      assert(result.a === 1);
    });

    it('should load null', () => {
      const result = utils.loadFile(path.join(baseDir, 'null.js'));
      assert(result === null);
    });

    it('should load null', () => {
      const result = utils.loadFile(path.join(baseDir, 'zero.js'));
      assert(result === 0);
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
      assert(result === null);
    });
  });
});
