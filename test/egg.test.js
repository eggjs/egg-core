'use strict';

const mm = require('mm');
const is = require('is-type-of');
const util = require('util');
const path = require('path');
const assert = require('assert');
const spy = require('spy');
const sleep = require('mz-modules/sleep');
const request = require('supertest');
const coffee = require('coffee');
const utils = require('./utils');
const EggCore = require('..').EggCore;
const awaitEvent = require('await-event');

describe('test/egg.test.js', () => {
  afterEach(mm.restore);

  describe('create EggCore', () => {
    let app;
    after(() => app && app.close());

    it('should set options and _options', () => {
      app = new EggCore();
      assert(app.options === app._options);
      assert.deepEqual(app.options, {
        baseDir: process.cwd(),
        type: 'application',
      });
    });

    it('should use cwd when no options', () => {
      app = new EggCore();
      assert(app._options.baseDir === process.cwd());
    });

    it('should set default application when no type', () => {
      app = new EggCore();
      assert(app.type === 'application');
    });

    it('should use options.serverScope', () => {
      app = new EggCore({ serverScope: 'scope' });
      assert(app.loader.serverScope === 'scope');
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

    it('should throw options.baseDir is not a directory', () => {
      try {
        new EggCore({
          baseDir: __filename,
        });
        throw new Error('should not run');
      } catch (err) {
        assert(err.message.includes(`Directory ${__filename} is not a directory`));
      }
    });

    it('should throw process.env.EGG_READY_TIMEOUT_ENV should be able to parseInt', () => {
      mm(process.env, 'EGG_READY_TIMEOUT_ENV', 'notAnNumber');
      assert.throws(() => {
        new EggCore();
      }, /process.env.EGG_READY_TIMEOUT_ENV notAnNumber should be able to parseInt/);
    });
  });

  describe('getters', () => {
    let app;
    before(() => {
      app = utils.createApp('app-getter');
      app.loader.loadPlugin();
      app.loader.loadConfig();
      app.loader.loadCustomApp();
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
    afterEach(() => app.close());

    it('should beforeStart param error', done => {
      try {
        app = utils.createApp('beforestart-params-error');
        app.loader.loadAll();
      } catch (err) {
        assert(err.message === 'boot only support function');
        done();
      }
    });

    it('should beforeStart excute success', async () => {
      app = utils.createApp('beforestart');
      app.loader.loadAll();
      assert(app.beforeStartFunction === false);
      assert(app.beforeStartGeneratorFunction === false);
      assert(app.beforeStartAsyncFunction === false);
      assert(app.beforeStartTranslateAsyncFunction === false);
      await app.ready();
      assert(app.beforeStartFunction === true);
      assert(app.beforeStartGeneratorFunction === true);
      assert(app.beforeStartAsyncFunction === true);
      assert(app.beforeStartTranslateAsyncFunction === true);
    });

    it('should beforeStart excute success with EGG_READY_TIMEOUT_ENV', async () => {
      mm(process.env, 'EGG_READY_TIMEOUT_ENV', '12000');
      app = utils.createApp('beforestart-with-timeout-env');
      app.loader.loadAll();
      assert(app.beforeStartFunction === false);
      await app.ready();
      assert(app.beforeStartFunction === true);
    });

    it('should beforeStart excute timeout without EGG_READY_TIMEOUT_ENV too short', function(done) {
      mm(process.env, 'EGG_READY_TIMEOUT_ENV', '1000');
      app = utils.createApp('beforestart-with-timeout-env');
      app.loader.loadAll();
      app.once('ready_timeout', id => {
        const file = path.normalize('test/fixtures/beforestart-with-timeout-env/app.js');
        assert(id.includes(file));
        done();
      });
    });

    it('should beforeStart excute failed', done => {
      app = utils.createApp('beforestart-error');
      app.loader.loadAll();
      app.once('error', err => {
        assert(err.message === 'not ready');
        done();
      });
    });

    it('should get error from ready when beforeStart excute failed', async () => {
      app = utils.createApp('beforestart-error');
      app.loader.loadAll();
      try {
        await app.ready();
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
        assert(id.includes(file));
        done();
      });
    });
  });

  describe('app.close()', () => {
    let app;

    it('should emit close event before exit', () => {
      app = utils.createApp('close');
      app.loader.loadAll();
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
      app.loader.loadAll();
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

    it('should throw error when call after error', async () => {
      app = utils.createApp('close');
      app.beforeClose(() => {
        throw new Error('error');
      });
      try {
        await app.close();
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'error');
      }
      try {
        await app.close();
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

    it('should wait beforeClose', async () => {
      await app.close();
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

    it('should close only once', async () => {
      await app.close();
      await app.close();
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

    it('should redefine Controller and Service ok', async () => {
      await request(app.callback())
        .get('/success')
        .expect(200)
        .expect({ success: true, result: { foo: 'bar' } });

      await request(app.callback())
        .get('/fail')
        .expect(200)
        .expect({ success: false, message: 'something wrong' });
    });
  });

  describe('run with DEBUG', () => {
    after(mm.restore);
    it('should ready', async () => {
      mm(process.env, 'DEBUG', '*');
      await coffee.fork(utils.getFilepath('run-with-debug/index.js'))
        .debug()
        .expect('code', 0)
        .end();
    });
  });

  describe('toAsyncFunction', () => {
    let app;
    before(() => {
      app = new EggCore();
    });

    it('translate generator function', () => {
      const fn = function* (arg) {
        assert.deepEqual(this, { foo: 'bar' });
        return arg;
      };
      const wrapped = app.toAsyncFunction(fn);
      assert(is.asyncFunction(wrapped));
      return wrapped.call({ foo: 'bar' }, true).then(res => assert(res === true));
    });

    it('not translate common function', () => {
      const fn = arg => Promise.resolve(arg);
      const wrapped = app.toAsyncFunction(fn);
      return wrapped(true).then(res => assert(res === true));
    });

    it('not translate common values', () => {
      const primitiveValues = [ 1, 2, 3, 4, 5, 6 ];
      const wrapped = app.toAsyncFunction(primitiveValues);
      return assert(wrapped === primitiveValues);
    });
  });

  describe('toPromise', () => {
    let app;
    before(() => {
      app = new EggCore();
    });

    it('translate array', () => {
      const fn = function* (arg) {
        return arg;
      };
      const arr = [ fn(1), fn(2) ];
      const promise = app.toPromise(arr);
      return promise.then(res => assert.deepEqual(res, [ 1, 2 ]));
    });

    it('translate object', () => {
      const fn = function* (arg) {
        return arg;
      };
      const obj = {
        first: fn(1),
        second: fn(2),
        third: 3,
      };
      const promise = app.toPromise(obj);
      return promise.then(res => assert.deepEqual(res, {
        first: 1,
        second: 2,
        third: 3,
      }));
    });
  });

  describe('timing', () => {
    let app;
    after(() => app && app.close());

    describe('app', () => {
      it('should get timing', function* () {
        app = utils.createApp('timing');
        app.loader.loadPlugin();
        app.loader.loadConfig();
        app.loader.loadApplicationExtend();
        app.loader.loadCustomApp();
        // app.loader.loadCustomAgent();
        app.loader.loadService();
        app.loader.loadMiddleware();
        app.loader.loadController();
        app.loader.loadRouter();
        yield app.ready();

        const json = app.timing.toJSON();
        assert(json.length === 24);

        assert(json[0].name === 'Application Start');
        assert(json[0].end - json[0].start === json[0].duration);
        assert(json[0].pid === process.pid);

        // loadPlugin
        assert(json[1].name === 'Load Plugin');

        // loadConfig
        assert(json[2].name === 'Load Config');
        assert(json[3].name === 'Require(0) config/config.default.js');
        assert(json[5].name === 'Require(2) config/config.default.js');

        // loadExtend
        assert(json[7].name === 'Load extend/application.js');
        assert(json[9].name === 'Require(5) app/extend/application.js');

        // loadCustomApp
        assert(json[10].name === 'Load app.js');
        assert(json[11].name === 'Require(6) app.js');
        assert(json[12].name === 'Before Start in app.js:6:9');
        assert(json[13].name === 'Load "proxy" to Context');
        assert(json[14].name === 'Load Controller');
        assert(json[15].name === 'Load "controller" to Application');

        // loadService
        assert(json[16].name === 'Load Service');
        assert(json[17].name === 'Load "service" to Context');

        // loadMiddleware
        assert(json[18].name === 'Load Middleware');
        assert(json[19].name === 'Load "middlewares" to Application');

        // loadController
        assert(json[20].name === 'Load Controller');
        assert(json[21].name === 'Load "controller" to Application');

        // loadRouter
        assert(json[22].name === 'Load Router');
        assert(json[23].name === 'Require(7) app/router.js');
      });
    });

    describe('agent', () => {
      it('should get timing', function* () {
        app = utils.createApp('timing');
        app.loader.loadPlugin();
        app.loader.loadConfig();
        app.loader.loadApplicationExtend();
        app.loader.loadCustomAgent();
        yield app.ready();

        const json = app.timing.toJSON();
        assert(json.length === 13);

        assert(json[0].name === 'Application Start');
        assert(json[0].end - json[0].start === json[0].duration);
        assert(json[0].pid === process.pid);

        // loadPlugin
        assert(json[1].name === 'Load Plugin');

        // loadConfig
        assert(json[2].name === 'Load Config');
        assert(json[3].name === 'Require(0) config/config.default.js');
        assert(json[5].name === 'Require(2) config/config.default.js');

        // loadExtend
        assert(json[7].name === 'Load extend/application.js');
        assert(json[9].name === 'Require(5) app/extend/application.js');

        // loadCustomAgent
        assert(json[10].name === 'Load agent.js');
        assert(json[11].name === 'Require(6) agent.js');
        assert(json[12].name === 'Before Start in agent.js:5:11');
      });
    });

  });

  describe('boot', () => {
    describe('boot success', () => {
      describe('app worker', () => {
        it('should success', async () => {
          const app = utils.createApp('boot');
          app.loader.loadAll();
          assert.deepStrictEqual(
            app.bootLog,
            [
              'configDidLoad in plugin',
              'app.js in plugin',
              'configDidLoad in app',
            ]);
          await app.ready();
          assert.deepStrictEqual(
            app.bootLog,
            [
              'configDidLoad in plugin',
              'app.js in plugin',
              'configDidLoad in app',
              'didLoad',
              'beforeStart',
              'willReady',
              'ready',
            ]);
          await sleep(10);
          assert.deepStrictEqual(
            app.bootLog,
            [
              'configDidLoad in plugin',
              'app.js in plugin',
              'configDidLoad in app',
              'didLoad',
              'beforeStart',
              'willReady',
              'ready',
              'didReady',
            ]);
          await app.lifecycle.triggerServerDidReady();
          await sleep(10);
          assert.deepStrictEqual(
            app.bootLog,
            [
              'configDidLoad in plugin',
              'app.js in plugin',
              'configDidLoad in app',
              'didLoad',
              'beforeStart',
              'willReady',
              'ready',
              'didReady',
              'serverDidReady',
            ]);
          await app.close();
          assert.deepStrictEqual(
            app.bootLog,
            [
              'configDidLoad in plugin',
              'app.js in plugin',
              'configDidLoad in app',
              'didLoad',
              'beforeStart',
              'willReady',
              'ready',
              'didReady',
              'serverDidReady',
              'beforeClose',
            ]);
        });
      });

      describe('agent worker', () => {
        it('should success', async () => {
          const app = utils.createApp('boot', { type: 'agent' });
          app.loader.loadPlugin();
          app.loader.loadConfig();
          app.loader.loadAgentExtend();
          app.loader.loadCustomAgent();
          assert.deepStrictEqual(
            app.bootLog,
            [
              'configDidLoad in plugin',
              'agent.js in plugin',
              'configDidLoad in app',
            ]);
          await app.ready();
          assert.deepStrictEqual(
            app.bootLog,
            [
              'configDidLoad in plugin',
              'agent.js in plugin',
              'configDidLoad in app',
              'didLoad',
              'beforeStart',
              'willReady',
              'ready',
            ]);
          await sleep(10);
          assert.deepStrictEqual(
            app.bootLog,
            [
              'configDidLoad in plugin',
              'agent.js in plugin',
              'configDidLoad in app',
              'didLoad',
              'beforeStart',
              'willReady',
              'ready',
              'didReady',
            ]);
          await app.lifecycle.triggerServerDidReady();
          await sleep(10);
          assert.deepStrictEqual(
            app.bootLog,
            [
              'configDidLoad in plugin',
              'agent.js in plugin',
              'configDidLoad in app',
              'didLoad',
              'beforeStart',
              'willReady',
              'ready',
              'didReady',
              'serverDidReady',
            ]);
          await app.close();
          assert.deepStrictEqual(
            app.bootLog,
            [
              'configDidLoad in plugin',
              'agent.js in plugin',
              'configDidLoad in app',
              'didLoad',
              'beforeStart',
              'willReady',
              'ready',
              'didReady',
              'serverDidReady',
              'beforeClose',
            ]);
        });
      });
    });

    describe('configDidLoad failed', () => {
      it('should throw error', async () => {
        const app = utils.createApp('boot-configDidLoad-error');
        let error;
        try {
          app.loader.loadAll();
          await app.ready();
        } catch (e) {
          error = e;
        }
        assert.strictEqual(error.message, 'configDidLoad error');
        assert.deepStrictEqual(app.bootLog, []);
      });
    });

    describe('didLoad failed', () => {
      it('should throw error', async () => {
        const app = utils.createApp('boot-didLoad-error');
        app.loader.loadAll();
        let error;
        try {
          await app.ready();
        } catch (e) {
          error = e;
        }
        assert.strictEqual(error.message, 'didLoad error');
        assert.deepStrictEqual(app.bootLog, [ 'configDidLoad' ]);
        await sleep(10);
        assert.deepStrictEqual(app.bootLog, [ 'configDidLoad', 'didReady' ]);
        await app.close();
        assert.deepStrictEqual(
          app.bootLog,
          [
            'configDidLoad',
            'didReady',
            'beforeClose',
          ]);
      });
    });

    describe('willReady failed', () => {
      it('should throw error', async () => {
        const app = utils.createApp('boot-willReady-error');
        app.loader.loadAll();
        let error;
        try {
          await app.ready();
        } catch (e) {
          error = e;
        }
        assert.deepStrictEqual(app.bootLog, [ 'configDidLoad', 'didLoad' ]);
        assert.strictEqual(error.message, 'willReady error');
        await sleep(10);
        assert.deepStrictEqual(app.bootLog, [ 'configDidLoad', 'didLoad', 'didReady' ]);
        await app.close();
        assert.deepStrictEqual(
          app.bootLog,
          [
            'configDidLoad',
            'didLoad',
            'didReady',
            'beforeClose',
          ]);
      });
    });

    describe('didReady failed', () => {
      it('should throw error', async () => {
        const app = utils.createApp('boot-didReady-error');
        app.loader.loadAll();
        await app.ready();

        assert.deepStrictEqual(app.bootLog, [ 'configDidLoad', 'didLoad', 'willReady' ]);
        let error;
        try {
          await awaitEvent(app, 'error');
        } catch (e) {
          error = e;
        }
        assert.strictEqual(error.message, 'didReady error');
        await app.close();
        assert.deepStrictEqual(
          app.bootLog,
          [
            'configDidLoad',
            'didLoad',
            'willReady',
            'beforeClose',
          ]);
      });
    });

    describe('serverDidLoad failed', () => {
      it('should throw error', async () => {
        const app = utils.createApp('boot-serverDidLoad-error');
        app.loader.loadAll();
        await app.ready();
        await sleep(10);
        assert.deepStrictEqual(app.bootLog, [
          'configDidLoad',
          'didLoad',
          'willReady',
          'didReady',
        ]);
        await app.lifecycle.triggerServerDidReady();
        let error;
        try {
          await awaitEvent(app, 'error');
        } catch (e) {
          error = e;
        }
        assert.strictEqual(error.message, 'serverDidReady failed');
      });
    });

    describe('use ready(func)', () => {
      it('should success', async () => {
        const app = utils.createApp('boot');
        app.loader.loadAll();
        await app.ready();
        assert.deepStrictEqual(
          app.bootLog,
          [
            'configDidLoad in plugin',
            'app.js in plugin',
            'configDidLoad in app',
            'didLoad',
            'beforeStart',
            'willReady',
            'ready',
          ]);
        app.ready(() => {
          app.bootLog.push('readyFunction');
        });
        await sleep(10);
        assert.deepStrictEqual(
          app.bootLog,
          [
            'configDidLoad in plugin',
            'app.js in plugin',
            'configDidLoad in app',
            'didLoad',
            'beforeStart',
            'willReady',
            'ready',
            'readyFunction',
            'didReady',
          ]);
        app.close();
      });
    });

    describe('boot timeout', () => {
      beforeEach(() => {
        mm(process.env, 'EGG_READY_TIMEOUT_ENV', 1);
      });

      it('should warn write filename and function', async () => {
        let timeoutId;
        const app = utils.createApp('boot-timeout');
        app.once('ready_timeout', id => {
          timeoutId = id;
        });
        app.loader.loadAll();
        await app.ready();
        assert(timeoutId);
        const suffix = path.normalize('test/fixtures/boot-timeout/app.js');
        assert(timeoutId.endsWith(suffix + ':didLoad'));
      });
    });

    describe('beforeClose order', () => {
      it('should be plugin dep -> plugin -> app', async () => {
        const app = utils.createApp('boot-before-close');
        app.loader.loadAll();
        await app.close();
        assert.deepStrictEqual(
          app.bootLog,
          [
            'beforeClose in app',
            'beforeClose in plugin',
            'beforeClose in plugin dep',
          ]);
      });
    });
  });
});
