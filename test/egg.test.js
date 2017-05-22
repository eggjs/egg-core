'use strict';

const mm = require('mm');
const util = require('util');
const path = require('path');
const assert = require('assert');
const spy = require('spy');
const sleep = require('mz-modules/sleep');
const request = require('supertest');
const utils = require('./utils');
const EggCore = require('..').EggCore;

describe('test/egg.test.js', () => {
  afterEach(mm.restore);

  describe('create EggCore', () => {

    let app;
    after(() => app && app.close());

    it('should use cwd when no options', () => {
      app = new EggCore();
      assert(app._options.baseDir === process.cwd());
    });

    it('should set default application when no type', () => {
      app = new EggCore();
      assert(app.type === 'application');
    });

    it('should not set value expect for application and agent', () => {
      assert.throws(() => {
        new EggCore({
          type: 'nothing',
        });
      }, /options.type should be application or agent/);
    });

    it('should throw options.baseDir required', () => {
      assert.throws(() => {
        new EggCore({
          baseDir: 1,
        });
      }, /options.baseDir required, and must be a string/);
    });

    it('should throw options.baseDir not exist', () => {
      assert.throws(() => {
        new EggCore({
          baseDir: 'not-exist',
        });
      }, /Directory not-exist not exists/);
    });

    it('should throw options.baseDir is not a directory', done => {
      try {
        new EggCore({
          baseDir: __filename,
        });
      } catch (err) {
        assert(err.message.indexOf(`Directory ${__filename} is not a directory`) >= 0);
        done();
      }
    });
  });

  describe('getters', () => {
    let app;
    before(() => {
      app = utils.createApp('app-getter');
      app.loader.loadPlugin();
      app.loader.loadConfig();
      return app.ready();
    });
    after(() => app.close());

    it('should has get type', () => {
      assert(app.type === 'application');
    });

    it('should has baseDir', () => {
      assert(app.baseDir === utils.getFilepath('app-getter'));
    });

    it('should has name', () => {
      assert(app.name === 'app-getter');
    });

    it('should has plugins', () => {
      assert(app.plugins);
      assert(app.plugins === app.loader.plugins);
    });

    it('should has config', () => {
      assert(app.config);
      assert(app.config === app.loader.config);
    });
  });

  describe('app.deprecate()', () => {
    let app;
    afterEach(() => app && app.close());

    it('should deprecate with namespace egg', () => {
      app = utils.createApp('deprecate');
      app.loader.loadAll();
      let deprecate = app.deprecate;
      assert(deprecate._namespace === 'egg');
      assert(deprecate === app.deprecate);
      assert(deprecate._file.match(/test(\/|\\)egg\.test\.js/));

      deprecate = app.env;
      assert(deprecate._namespace === 'egg');
      assert(deprecate !== app.deprecate);
      assert(deprecate._file.match(/extend(\/|\\)application\.js/));
    });
  });

  describe('app.readyCallback()', () => {
    let app;
    afterEach(() => app.close());

    it('should log info when plugin is not ready', done => {
      app = utils.createApp('notready');
      app.loader.loadAll();
      mm(app.console, 'warn', (message, b, a) => {
        assert(message === '[egg:core:ready_timeout] %s seconds later %s was still unable to finish.');
        assert(b === 10);
        assert(a === 'a');
        done();
      });
      app.ready(() => {
        throw new Error('should not be called');
      });
    });

    it('should log info when plugin is not ready', done => {
      app = utils.createApp('ready');
      app.loader.loadAll();
      let message = '';
      mm(app.console, 'info', (a, b, c) => {
        message += util.format.apply(null, [ a, b, c ]);
      });
      app.ready(() => {
        assert(/\[egg:core:ready_stat] end ready task a, remain \["b"]/.test(message));
        assert(/\[egg:core:ready_stat] end ready task b, remain \[]/.test(message));
        done();
      });
    });
  });

  describe('app.beforeStart()', () => {
    let app;
    afterEach(mm.restore);
    afterEach(() => app.close());

    it('should beforeStart param error', done => {
      try {
        app = utils.createApp('beforestart-params-error');
        app.loader.loadAll();
      } catch (err) {
        assert(err.message === 'beforeStart only support function');
        done();
      }
    });

    it('should beforeStart excute success', function* () {
      app = utils.createApp('beforestart');
      app.loader.loadAll();
      assert(app.beforeStartFunction === false);
      assert(app.beforeStartGeneratorFunction === false);
      assert(app.beforeStartAsyncFunction === false);
      yield app.ready();
      assert(app.beforeStartFunction === true);
      assert(app.beforeStartGeneratorFunction === true);
      assert(app.beforeStartAsyncFunction === true);
    });

    it('should beforeStart excute success with EGG_READY_TIMEOUT_ENV', function* () {
      mm(process.env, 'EGG_READY_TIMEOUT_ENV', '12000');
      const start = Date.now();
      app = utils.createApp('beforestart-timeout');
      app.loader.loadAll();
      yield app.ready();
      assert(Date.now() - start > 11000);
    });

    it('should beforeStart excute failed', done => {
      app = utils.createApp('beforestart-error');
      app.loader.loadAll();
      app.once('error', err => {
        assert(err.message === 'not ready');
        done();
      });
    });

    it('should get error from ready when beforeStart excute failed', function* () {
      app = utils.createApp('beforestart-error');
      app.loader.loadAll();
      try {
        yield app.ready();
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'not ready');
      }
    });

    it('should beforeStart excute timeout', done => {
      app = utils.createApp('beforestart-timeout');
      app.loader.loadAll();
      app.once('ready_timeout', id => {
        const file = path.normalize('test/fixtures/beforestart-timeout/app.js');
        assert(id.indexOf(file) >= 0);
        done();
      });
    });
  });

  describe('app.close()', () => {
    let app;

    it('should emit close event before exit', () => {
      app = utils.createApp('close');
      let called = false;
      app.on('close', () => {
        called = true;
      });
      app.close();
      assert(called === true);
    });

    it('should return a promise', done => {
      app = utils.createApp('close');
      const promise = app.close();
      assert(promise instanceof Promise);
      promise.then(done);
    });

    it('should throw when close error', done => {
      app = utils.createApp('close');
      mm(app, 'removeAllListeners', () => {
        throw new Error('removeAllListeners error');
      });
      app.close().catch(err => {
        assert(err.message === 'removeAllListeners error');
        done();
      });
    });

    it('should close only once', done => {
      const fn = spy();
      app = utils.createApp('close');
      app.beforeClose(fn);
      Promise.all([
        app.close(),
        app.close(),
      ]).then(() => {
        assert(fn.callCount === 1);
        done();
      }).catch(done);
      assert(app.close().then);
    });

    it('should throw error when call after error', function* () {
      app = utils.createApp('close');
      app.beforeClose(() => {
        throw new Error('error');
      });
      try {
        yield app.close();
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'error');
      }
      try {
        yield app.close();
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'error');
      }
    });

    it('should return same promise when call twice', done => {
      const first = spy();
      const second = spy();
      app = utils.createApp('close');
      app.beforeClose(() => sleep(200));
      app.close().then(first);
      app.close().then(second);
      setTimeout(() => {
        assert(first.calledBefore(second));
        done();
      }, 500);
    });
  });

  describe('app.beforeClose', () => {
    let app;
    beforeEach(() => {
      app = utils.createApp('app-before-close');
      app.loader.loadAll();
      return app.ready();
    });
    afterEach(() => app && app.close());

    it('should wait beforeClose', function* () {
      yield app.close();
      assert(app.closeFn === true);
      assert(app.closeGeneratorFn === true);
      assert(app.closeAsyncFn === true);
      assert(app.onlyOnce === false);
      assert(app.closeEvent === 'after');
      assert(app.closeOrderArray.join(',') === 'closeAsyncFn,closeGeneratorFn,closeFn');
    });

    it('should throw when call beforeClose without function', () => {
      assert.throws(() => {
        app.beforeClose();
      }, /argument should be function/);
    });

    it('should close only once', function* () {
      yield app.close();
      yield app.close();
      assert(app.callCount === 1);
    });
  });

  describe('Service and Controller', () => {
    let app;
    before(() => {
      app = utils.createApp('extend-controller-service');
      app.loader.loadAll();
      return app.ready();
    });

    after(() => app.close());

    it('should redefine Controller and Service ok', function* () {
      yield request(app.callback())
      .get('/success')
      .expect(200)
      .expect({ success: true, result: { foo: 'bar' } });

      yield request(app.callback())
      .get('/fail')
      .expect(200)
      .expect({ success: false, message: 'something wrong' });
    });
  });
});
