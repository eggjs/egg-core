'use strict';

const assert = require('assert');
const os = require('os');
const mm = require('mm');
const utils = require('../utils');

describe('test/loader/egg_loader.test.js', () => {
  let app;
  before(() => {
    app = utils.createApp('nothing');
  });

  it('should container FileLoader and ContextLoader', () => {
    assert(app.loader.FileLoader);
    assert(app.loader.ContextLoader);
  });

  describe('loader.getHomedir()', () => {
    afterEach(mm.restore);

    it('should return process.env.HOME', () => {
      if (os.userInfo && os.userInfo().homedir) {
        const userInfo = os.userInfo();
        delete userInfo.homedir;
        mm(os, 'userInfo', () => userInfo);
      }
      assert(app.loader.getHomedir() === process.env.HOME);
    });

    it('should return /home/admin when process.env.HOME is not exist', () => {
      mm(process.env, 'HOME', '');
      mm(os, 'userInfo', null);
      mm(os, 'homedir', null);
      assert(app.loader.getHomedir() === '/home/admin');
    });

    it('should return when EGG_HOME exists', () => {
      mm(process.env, 'EGG_HOME', '/path/to/home');
      assert(app.loader.getHomedir() === '/path/to/home');
    });

    it('should warning when typescript was true but no ts extension', done => {
      mm(process.stdout, 'write', msg => {
        assert(msg.includes('`require.extensions` should contains `.ts` while `options.typescript` was true'));
        done();
      });
      utils.createApp('nothing', { typescript: true });
    });
  });
});
