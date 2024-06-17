import util from 'node:util';
import path from 'node:path';
import { strict as assert } from 'node:assert';
import fs from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import mm from 'mm';
// import is from 'is-type-of';
// import spy from 'spy';
import request from 'supertest';
import coffee from 'coffee';
import { createApp, getFilepath, Application } from './helper.js';
import { EggCore } from '../src/index.js';

describe.skip('test/egg.test.ts', () => {
  afterEach(mm.restore);

  describe('create EggCore', () => {
    let app: EggCore;
    after(() => app && app.close());

    it('should set options and _options', () => {
      app = new EggCore();
      assert.equal((app as any)._options, undefined);
      assert.deepEqual(app.options, {
        baseDir: process.cwd(),
        type: 'application',
      });
    });

    it('should use cwd when no options', () => {
      app = new EggCore();
      assert.equal(app.options.baseDir, process.cwd());
    });

    it('should set default application when no type', () => {
      app = new EggCore();
      assert.equal(app.type, 'application');
    });

    it('should use options.serverScope', () => {
      app = new EggCore({ serverScope: 'scope' });
      assert.equal(app.loader.serverScope, 'scope');
    });

    it('should not set value expect for application and agent', () => {
      assert.throws(() => {
        new EggCore({
          type: 'nothing',
        } as any);
      }, /options.type should be application or agent/);
    });

    it('should throw options.baseDir required', () => {
      assert.throws(() => {
        new EggCore({
          baseDir: 1,
        } as any);
      }, /options.baseDir required, and must be a string/);
    });

    it('should throw options.baseDir not exist', () => {
      assert.throws(() => {
        new EggCore({
          baseDir: 'not-exist',
        });
      }, /not-exist not exists/);
    });

    it('should throw options.baseDir is not a directory', () => {
      assert.throws(() => {
        new EggCore({
          baseDir: getFilepath('egg/index.js'),
        });
      }, /not a directory/);
    });

    it('should throw process.env.EGG_READY_TIMEOUT_ENV should be able to parseInt', () => {
      mm(process.env, 'EGG_READY_TIMEOUT_ENV', 'notAnNumber');
      assert.throws(() => {
        new EggCore();
      }, /process.env.EGG_READY_TIMEOUT_ENV notAnNumber should be able to parseInt/);
    });
  });

  describe('getters', () => {
    let app: EggCore;
    before(() => {
      app = createApp('app-getter');
      app.loader.loadPlugin();
      app.loader.loadConfig();
      app.loader.loadCustomApp();
      return app.ready();
    });
    after(() => app.close());

    it('should has get type', () => {
      assert.equal(app.type, 'application');
    });

    it('should has baseDir', () => {
      assert.equal(app.baseDir, getFilepath('app-getter'));
    });

    it('should has name', () => {
      assert.equal(app.name, 'app-getter');
    });

    it('should has plugins', () => {
      assert(app.plugins);
      assert.equal(app.plugins, app.loader.plugins);
    });

    it('should has config', () => {
      assert(app.config);
      assert.equal(app.config, app.loader.config);
    });
  });

  describe('app.deprecate()', () => {
    let app: Application;
    afterEach(() => app && app.close());

    it('should deprecate with namespace egg', async () => {
      app = createApp('deprecate');
      await app.loader.loadAll();
      assert.equal(typeof app.deprecate, 'function');
    });
  });

  describe('app.readyCallback()', () => {
    let app: Application;
    afterEach(() => app.close());

    it('should log info when plugin is not ready', async () => {
      app = createApp('notready');
      await app.loader.loadAll();
      await app.ready();
      // mm(app.console, 'warn', (message: string, b: any, a: any) => {
      //   assert(message === '[egg:core:ready_timeout] %s seconds later %s was still unable to finish.');
      //   assert(b === 10);
      //   assert(a === 'a');
      //   console.log(app.timing.toString());
      //   done();
      // });
      // app.loader.loadAll().then(() => {
      //   app.ready(() => {
      //     throw new Error('should not be called');
      //   });
      // });
    });

    it('should log info when plugin is ready', done => {
      app = createApp('ready');
      app.loader.loadAll();
      let message = '';
      mm(app.console, 'info', (a: any, b: any, c: any) => {
        message += util.format.apply(null, [ a, b, c ]);
      });
      app.ready(() => {
        assert(/\[egg:core:ready_stat] end ready task a, remain \["b"]/.test(message));
        assert(/\[egg:core:ready_stat] end ready task b, remain \[]/.test(message));
        console.log(app.timing.toString());
        done();
      });
    });
  });

  describe('app.beforeStart()', () => {
    let app: Application;
    afterEach(() => app.close());

    it('should beforeStart param error', done => {
      try {
        app = createApp('beforestart-params-error');
        app.loader.loadAll();
      } catch (err: any) {
        assert.equal(err.message, 'boot only support function');
        done();
      }
    });

    it('should beforeStart excute success', async () => {
      app = createApp('beforestart');
      app.loader.loadAll();
      assert((app as any).beforeStartFunction === false);
      assert((app as any).beforeStartGeneratorFunction === false);
      assert((app as any).beforeStartAsyncFunction === false);
      assert((app as any).beforeStartTranslateAsyncFunction === false);
      await app.ready();
      assert((app as any).beforeStartFunction === true);
      assert((app as any).beforeStartGeneratorFunction === true);
      assert((app as any).beforeStartAsyncFunction === true);
      assert((app as any).beforeStartTranslateAsyncFunction === true);
    });

    it('should beforeStart excute success with EGG_READY_TIMEOUT_ENV', async () => {
      mm(process.env, 'EGG_READY_TIMEOUT_ENV', '12000');
      app = createApp('beforestart-with-timeout-env');
      app.loader.loadAll();
      assert((app as any).beforeStartFunction === false);
      await app.ready();
      assert((app as any).beforeStartFunction === true);
      const timeline = app.timing.toString();
      console.log(timeline);
      assert.match(timeline, /#14 Before Start in app.js:3:7/);
    });

    it('should beforeStart excute timeout without EGG_READY_TIMEOUT_ENV too short', function(done) {
      mm(process.env, 'EGG_READY_TIMEOUT_ENV', '1000');
      app = createApp('beforestart-with-timeout-env');
      app.loader.loadAll();
      app.once('ready_timeout', id => {
        const file = path.normalize('test/fixtures/beforestart-with-timeout-env/app.js');
        assert(id.includes(file));
        const timeline = app.timing.toString();
        console.log(timeline);
        assert.match(timeline, /▇ \[\d+ms NOT_END] - #1 Application Start/);
        assert.match(timeline, /▇ \[\d+ms NOT_END] - #14 Before Start in app.js:3:7/);
        done();
      });
    });

    it('should beforeStart excute failed', done => {
      app = createApp('beforestart-error');
      app.loader.loadAll();
      app.once('error', err => {
        assert(err.message === 'not ready');
        console.log(app.timing.toString());
        done();
      });
    });

    it('should get error from ready when beforeStart excute failed', async () => {
      app = createApp('beforestart-error');
      app.loader.loadAll();
      try {
        await app.ready();
        throw new Error('should not run');
      } catch (err: any) {
        assert(err.message === 'not ready');
        console.log(app.timing.toString());
      }
    });

    it('should beforeStart excute timeout', done => {
      app = createApp('beforestart-timeout');
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
      app = createApp('close');
      app.loader.loadAll();
      let called = false;
      app.on('close', () => {
        called = true;
      });
      app.close();
      assert.equal(called, true);
    });

    it('should return a promise', done => {
      app = createApp('close');
      const promise = app.close();
      assert(promise instanceof Promise);
      promise.then(done);
    });

    it('should throw when close error', done => {
      app = createApp('close');
      app.loader.loadAll();
      mm(app, 'removeAllListeners', () => {
        throw new Error('removeAllListeners error');
      });
      app.close().catch(err => {
        assert(err.message === 'removeAllListeners error');
        done();
      });
    });

    // it('should close only once', done => {
    //   const fn = spy();
    //   app = utils.createApp('close');
    //   app.beforeClose(fn);
    //   Promise.all([
    //     app.close(),
    //     app.close(),
    //   ]).then(() => {
    //     assert(fn.callCount === 1);
    //     done();
    //   }).catch(done);
    //   assert(app.close().then);
    // });

    it('should throw error when call after error', async () => {
      app = createApp('close');
      app.beforeClose(() => {
        throw new Error('error');
      });
      try {
        await app.close();
        throw new Error('should not run');
      } catch (err: any) {
        assert(err.message === 'error');
      }
      try {
        await app.close();
        throw new Error('should not run');
      } catch (err: any) {
        assert(err.message === 'error');
      }
    });
  });

  describe('app.beforeClose', () => {
    let app: Application;
    beforeEach(() => {
      app = createApp('app-before-close');
      app.loader.loadAll();
      return app.ready();
    });
    afterEach(() => app && app.close());

    it('should wait beforeClose', async () => {
      await app.close();
      assert((app as any).closeFn === true);
      assert((app as any).closeGeneratorFn === true);
      assert((app as any).closeAsyncFn === true);
      assert((app as any).onlyOnce === false);
      assert((app as any).closeEvent === 'after');
      assert((app as any).closeOrderArray.join(',') === 'closeAsyncFn,closeGeneratorFn,closeFn');
    });

    it('should throw when call beforeClose without function', () => {
      assert.throws(() => {
        (app as any).beforeClose();
      }, /argument should be function/);
    });

    it('should close only once', async () => {
      await app.close();
      await app.close();
      assert((app as any).callCount === 1);
    });
  });

  describe('Service and Controller', () => {
    let app: Application;
    before(() => {
      app = createApp('extend-controller-service');
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
      await coffee.fork(getFilepath('run-with-debug/index.js'))
        .debug()
        .expect('code', 0)
        .end();
    });
  });

  // describe('toAsyncFunction', () => {
  //   let app: EggCore;
  //   before(() => {
  //     app = new EggCore();
  //   });

  //   it('translate generator function', () => {
  //     const fn = function* (arg) {
  //       assert.deepEqual(this, { foo: 'bar' });
  //       return arg;
  //     };
  //     const wrapped = app.toAsyncFunction(fn);
  //     assert(is.asyncFunction(wrapped));
  //     return wrapped.call({ foo: 'bar' }, true).then(res => assert(res === true));
  //   });

  //   it('not translate common function', () => {
  //     const fn = arg => Promise.resolve(arg);
  //     const wrapped = app.toAsyncFunction(fn);
  //     return wrapped(true).then(res => assert(res === true));
  //   });

  //   it('not translate common values', () => {
  //     const primitiveValues = [ 1, 2, 3, 4, 5, 6 ];
  //     const wrapped = app.toAsyncFunction(primitiveValues);
  //     return assert(wrapped === primitiveValues);
  //   });
  // });

  // describe('toPromise', () => {
  //   let app: EggCore;
  //   before(() => {
  //     app = new EggCore();
  //   });

  //   it('translate array', () => {
  //     const fn = function* (arg) {
  //       return arg;
  //     };
  //     const arr = [ fn(1), fn(2) ];
  //     const promise = app.toPromise(arr);
  //     return promise.then(res => assert.deepEqual(res, [ 1, 2 ]));
  //   });

  //   it('translate object', () => {
  //     const fn = function* (arg) {
  //       return arg;
  //     };
  //     const obj = {
  //       first: fn(1),
  //       second: fn(2),
  //       third: 3,
  //     };
  //     const promise = app.toPromise(obj);
  //     return promise.then(res => assert.deepEqual(res, {
  //       first: 1,
  //       second: 2,
  //       third: 3,
  //     }));
  //   });
  // });

  describe('timing', () => {
    let app: Application;
    after(() => app && app.close());

    describe('app', () => {
      it('should get timing', async () => {
        app = createApp('timing');
        app.loader.loadPlugin();
        app.loader.loadConfig();
        app.loader.loadApplicationExtend();
        app.loader.loadCustomApp();
        // app.loader.loadCustomAgent();
        app.loader.loadService();
        app.loader.loadMiddleware();
        app.loader.loadController();
        app.loader.loadRouter();
        await app.ready();

        const json = app.timing.toJSON();
        assert(json.length === 28);

        assert(json[1].name === 'Application Start');
        assert(json[1].end! - json[1].start === json[1].duration);
        assert(json[1].pid === process.pid);

        // loadPlugin
        assert(json[2].name === 'Load Plugin');

        // loadConfig
        assert(json[3].name === 'Load Config');
        assert(json[4].name === 'Require(0) config/config.default.js');
        assert(json[6].name === 'Require(2) config/config.default.js');

        // loadExtend
        assert(json[8].name === 'Load extend/application.js');
        assert(json[10].name === 'Require(5) app/extend/application.js');

        // loadCustomApp
        assert(json[11].name === 'Load app.js');
        // test/fixtures/egg/node_modules/session/app.js
        assert(json[12].name.startsWith('Require(6) '));
        assert(json[13].name === 'Require(7) app.js');
        assert.equal(json[14].name, 'Before Start in app.js:9:7');
        assert(json[15].name === 'Before Start in mock Block');
        assert(json[16].name === 'readyCallback in mockReadyCallbackWithoutFunction');

        assert(json[17].name === 'Load "proxy" to Context');
        assert(json[18].name === 'Load Controller');
        assert(json[19].name === 'Load "controller" to Application');

        // loadService
        assert(json[20].name === 'Load Service');
        assert(json[21].name === 'Load "service" to Context');

        // loadMiddleware
        assert(json[22].name === 'Load Middleware');
        assert(json[23].name === 'Load "middlewares" to Application');

        // loadController
        assert(json[24].name === 'Load Controller');
        assert(json[25].name === 'Load "controller" to Application');

        // loadRouter
        assert(json[26].name === 'Load Router');
        assert(json[27].name === 'Require(8) app/router.js');
      });
    });

    describe('agent', () => {
      it('should get timing', async () => {
        app = createApp('timing');
        app.loader.loadPlugin();
        app.loader.loadConfig();
        app.loader.loadApplicationExtend();
        app.loader.loadCustomAgent();
        await app.ready();

        const json = app.timing.toJSON();
        assert(json.length === 14);

        assert(json[1].name === 'Application Start');
        assert(json[1].end! - json[1].start === json[1].duration);
        assert(json[1].pid === process.pid);

        // loadPlugin
        assert(json[2].name === 'Load Plugin');

        // loadConfig
        assert(json[3].name === 'Load Config');
        assert(json[4].name === 'Require(0) config/config.default.js');
        assert(json[6].name === 'Require(2) config/config.default.js');

        // loadExtend
        assert(json[8].name === 'Load extend/application.js');
        assert(json[10].name === 'Require(5) app/extend/application.js');

        // loadCustomAgent
        assert(json[11].name === 'Load agent.js');
        assert(json[12].name === 'Require(6) agent.js');
        assert.equal(json[13].name, 'Before Start in agent.js:8:9');
      });
    });

    describe('script timing', () => {
      it('should work', async () => {
        const fixtureApp = getFilepath('timing');
        await coffee.fork(path.join(fixtureApp, 'index.js'))
          .beforeScript(path.join(fixtureApp, 'preload'))
          .debug()
          .expect('code', 0)
          .end();
        const timingJSON = await fs.readFile(path.join(fixtureApp, 'timing.json'), 'utf8');
        const timing = JSON.parse(timingJSON);
        const scriptStart = timing.find((item: any) => item.name === 'Script Start');
        assert(scriptStart);
        assert(scriptStart.start);
        assert(scriptStart.end);
      });
    });
  });

  describe('boot', () => {
    describe('boot success', () => {
      describe('app worker', () => {
        it('should success', async () => {
          const app = createApp('boot');
          app.loader.loadAll();
          assert.deepStrictEqual(
            (app as any).bootLog,
            [
              'configDidLoad in plugin',
              'app.js in plugin',
              'configDidLoad in app',
            ]);
          await app.ready();
          assert.deepStrictEqual(
            (app as any).bootLog,
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
            (app as any).bootLog,
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
            (app as any).bootLog,
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
            (app as any).bootLog,
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
          const app = createApp('boot', { type: 'agent' });
          app.loader.loadPlugin();
          app.loader.loadConfig();
          app.loader.loadAgentExtend();
          app.loader.loadCustomAgent();
          assert.deepStrictEqual(
            (app as any).bootLog,
            [
              'configDidLoad in plugin',
              'agent.js in plugin',
              'configDidLoad in app',
            ]);
          await app.ready();
          assert.deepStrictEqual(
            (app as any).bootLog,
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
            (app as any).bootLog,
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
            (app as any).bootLog,
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
            (app as any).bootLog,
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
        const app = createApp('boot-configDidLoad-error');
        let error: any;
        try {
          app.loader.loadAll();
          await app.ready();
        } catch (e) {
          error = e;
        }
        assert.strictEqual(error.message, 'configDidLoad error');
        assert.deepStrictEqual((app as any).bootLog, []);
      });
    });

    describe('didLoad failed', () => {
      it('should throw error', async () => {
        const app = createApp('boot-didLoad-error');
        app.loader.loadAll();
        let error: any;
        try {
          await app.ready();
        } catch (e) {
          error = e;
        }
        assert.strictEqual(error.message, 'didLoad error');
        assert.deepStrictEqual((app as any).bootLog, [ 'configDidLoad' ]);
        await sleep(10);
        assert.deepStrictEqual((app as any).bootLog, [ 'configDidLoad', 'didReady' ]);
        await app.close();
        assert.deepStrictEqual(
          (app as any).bootLog,
          [
            'configDidLoad',
            'didReady',
            'beforeClose',
          ]);
        console.log(app.timing.toString());
        assert.match(app.timing.toString(), /egg start timeline:/);
        assert.match(app.timing.toString(), /#1 Application Start/);
      });
    });

    describe('willReady failed', () => {
      it('should throw error', async () => {
        const app = createApp('boot-willReady-error');
        app.loader.loadAll();
        let error: any;
        try {
          await app.ready();
        } catch (e) {
          error = e;
        }
        assert.deepStrictEqual((app as any).bootLog, [ 'configDidLoad', 'didLoad' ]);
        assert.strictEqual(error.message, 'willReady error');
        await sleep(10);
        assert.deepStrictEqual((app as any).bootLog, [ 'configDidLoad', 'didLoad', 'didReady' ]);
        await app.close();
        assert.deepStrictEqual(
          (app as any).bootLog,
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
        const app = createApp('boot-didReady-error');
        app.loader.loadAll();
        await app.ready();

        assert.deepStrictEqual((app as any).bootLog, [ 'configDidLoad', 'didLoad', 'willReady' ]);
        let error: any;
        try {
          await new Promise((_resolve, reject) => {
            app.on('error', err => reject(err));
          });
        } catch (e) {
          error = e;
        }
        assert.strictEqual(error.message, 'didReady error');
        await app.close();
        assert.deepStrictEqual(
          (app as any).bootLog,
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
        const app = createApp('boot-serverDidLoad-error');
        app.loader.loadAll();
        await app.ready();
        await sleep(10);
        assert.deepStrictEqual((app as any).bootLog, [
          'configDidLoad',
          'didLoad',
          'willReady',
          'didReady',
        ]);
        await app.lifecycle.triggerServerDidReady();
        let error: any;
        try {
          await new Promise((_resolve, reject) => {
            app.on('error', err => reject(err));
          });
        } catch (e) {
          error = e;
        }
        assert.strictEqual(error.message, 'serverDidReady failed');
      });
    });

    describe('use ready(func)', () => {
      it('should success', async () => {
        const app = createApp('boot');
        app.loader.loadAll();
        await app.ready();
        assert.deepStrictEqual(
          (app as any).bootLog,
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
          (app as any).bootLog.push('readyFunction');
        });
        await sleep(10);
        assert.deepStrictEqual(
          (app as any).bootLog,
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
        let timeoutId: any;
        const app = createApp('boot-timeout');
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
        const app = createApp('boot-before-close');
        await app.loader.loadAll();
        await app.close();
        assert.deepStrictEqual(
          (app as any).bootLog,
          [
            'beforeClose in app',
            'beforeClose in plugin',
            'beforeClose in plugin dep',
          ]);
      });
    });
  });
});
