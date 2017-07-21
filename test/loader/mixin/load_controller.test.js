'use strict';

const is = require('is-type-of');
const assert = require('assert');
const request = require('supertest');
const path = require('path');
const utils = require('../../utils');

describe('test/loader/mixin/load_controller.test.js', () => {

  let app;
  before(() => {
    app = utils.createApp('controller-app');
    app.loader.loadAll();
    return app.ready();
  });
  after(() => app.close());

  describe('when controller is async function', () => {

    it('should thrown', done => {
      try {
        const app = utils.createApp('async-controller-app');
        app.loader.loadController();
      } catch (err) {
        assert(err.message.match(/^app(\/|\\)controller(\/|\\)async\.js cannot be async function/));
        done();
      }
    });
  });

  describe('when controller is generator function', () => {

    it('should use it as middleware', () => {
      assert(app.controller.generatorFunction);

      return request(app.callback())
        .get('/generator-function')
        .expect(200)
        .expect('done');
    });

    it('should first argument is ctx', () => {
      assert(app.controller.generatorFunction);

      return request(app.callback())
        .get('/generator-function-ctx')
        .expect(200)
        .expect('done');
    });
  });

  describe('when controller is object', () => {

    it('should define method which is function', () => {
      assert(app.controller.object.callFunction);

      return request(app.callback())
        .get('/object-function')
        .expect(200)
        .expect('done');
    });

    it('should define method which is generator function', () => {
      assert(app.controller.object.callGeneratorFunction);

      return request(app.callback())
        .get('/object-generator-function')
        .expect(200)
        .expect('done');
    });

    it('should define method which is generator function with argument', () => {
      assert(app.controller.object.callGeneratorFunctionWithArg);

      return request(app.callback())
        .get('/object-generator-function-arg')
        .expect(200)
        .expect('done');
    });

    it('should define method which is async function', () => {
      assert(app.controller.object.callAsyncFunction);

      return request(app.callback())
        .get('/object-async-function')
        .expect(200)
        .expect('done');
    });

    it('should define method which is async function with argument', () => {
      assert(app.controller.object.callAsyncFunctionWithArg);

      return request(app.callback())
        .get('/object-async-function-arg')
        .expect(200)
        .expect('done');
    });

    it('should not load properties that are not function', () => {
      assert(!app.controller.object.nofunction);
    });

    it('should match app.resources', function* () {
      yield request(app.callback())
        .get('/resources-object')
        .expect(200)
        .expect('index');

      yield request(app.callback())
        .post('/resources-object')
        .expect(200)
        .expect('create');

      yield request(app.callback())
        .post('/resources-object/1')
        .expect(404);
    });
  });

  describe('when controller is class', () => {

    it('should define method which is function', () => {
      assert(app.controller.class.callFunction);

      return request(app.callback())
        .get('/class-function')
        .expect(200)
        .expect('done');
    });

    it('should define method which is generator function', () => {
      assert(app.controller.class.callGeneratorFunction);

      return request(app.callback())
        .get('/class-generator-function')
        .expect(200)
        .expect('done');
    });

    it('should define method which is generator function with ctx', () => {
      assert(app.controller.class.callGeneratorFunctionWithArg);

      return request(app.callback())
        .get('/class-generator-function-arg')
        .expect(200)
        .expect('done');
    });

    it('should define method which is async function', () => {
      assert(app.controller.class.callAsyncFunction);

      return request(app.callback())
        .get('/class-async-function')
        .expect(200)
        .expect('done');
    });

    it('should define method which is async function with ctx', () => {
      assert(app.controller.class.callAsyncFunctionWithArg);

      return request(app.callback())
        .get('/class-async-function-arg')
        .expect(200)
        .expect('done');
    });

    it('should not load properties that are not function', () => {
      assert(!app.controller.class.nofunction);
    });

    it('should not override constructor', () => {
      assert(/\[native code]/.test(app.controller.class.constructor.toString()));
    });

    it('should load class that is wrapped by function', () => {
      return request(app.callback())
        .get('/class-wrap-function')
        .expect(200)
        .expect('done');
    });

    it('should match app.resources', function* () {
      yield request(app.callback())
        .get('/resources-class')
        .expect(200)
        .expect('index');

      yield request(app.callback())
        .post('/resources-class')
        .expect(200)
        .expect('create');

      yield request(app.callback())
        .post('/resources-class/1')
        .expect(404);
    });

    it('should get pathName from Controller instance', () => {
      return request(app.callback())
        .get('/class-pathname')
        .expect(200)
        .expect('controller.admin.config');
    });

    it('should get fullPath from Controller instance', () => {
      return request(app.callback())
        .get('/class-fullpath')
        .expect(200)
        .expect(path.join(utils.getFilepath('controller-app'), 'app/controller/admin/config.js'));
    });
  });

  describe('next argument', () => {
    it('should throw error', () => {
      try {
        const app = utils.createApp('controller-next-argument');
        app.loader.loadAll();
        throw new Error('should not run');
      } catch (err) {
        assert(/controller `next` should not use next as argument from file/.test(err.message));
      }
    });
  });

  describe('function attribute', () => {
    it('should keep function attribute ok', () => {
      assert(is.function(app.controller.functionAttr.getAccountInfo));
      assert(is.generatorFunction(app.controller.functionAttr.getAccountInfo));
      assert(app.controller.functionAttr.getAccountInfo.operationType);
      assert(app.controller.functionAttr.foo && is.generatorFunction(app.controller.functionAttr.foo.bar));
      assert.deepEqual(app.controller.functionAttr.foo.bar.operationType, {
        value: 'account.foo.bar',
        name: 'account.foo.bar',
        desc: 'account.foo.bar',
        checkSign: true,
      });
    });
  });

  describe('not controller', () => {
    it('should load a number', () => {
      assert(app.controller.number === 123);
    });
  });

  describe('controller in other directory', () => {
    let app;
    before(() => {
      const baseDir = utils.getFilepath('other-directory');
      app = utils.createApp('other-directory');
      app.loader.loadController({
        directory: path.join(baseDir, 'app/other-controller'),
      });
      return app.ready();
    });
    after(() => app.close());

    it('should load', () => {
      assert(app.controller.user);
    });
  });

  describe('when controller.supportParams === true', () => {
    let app;
    before(() => {
      app = utils.createApp('controller-params');
      app.loader.loadAll();
      return app.ready();
    });
    after(() => app.close());

    it('should use as controller', function* () {
      yield request(app.callback())
        .get('/generator-function')
        .expect(200)
        .expect('done');
      yield request(app.callback())
        .get('/class-function')
        .expect(200)
        .expect('done');
      yield request(app.callback())
        .get('/object-function')
        .expect(200)
        .expect('done');
    });

    it('should support parameter', function* () {
      const ctx = { app };
      const args = [ 1, 2, 3 ];
      let r = yield app.controller.generatorFunction.call(ctx, ...args);
      assert.deepEqual(args, r);
      r = yield app.controller.object.callFunction.call(ctx, ...args);
      assert.deepEqual(args, r);
      r = yield app.controller.class.callFunction.call(ctx, ...args);
      assert.deepEqual(args, r);
    });
  });
});
