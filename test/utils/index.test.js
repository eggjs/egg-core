'use strict';

const mm = require('mm');
const os = require('os');
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
});
