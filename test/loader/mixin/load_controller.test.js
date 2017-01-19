'use strict';

// const path = require('path');
const assert = require('assert');
const request = require('supertest');
const utils = require('../../utils');


describe('test/loader/mixin/load_controller.test.js', () => {

  let app;
  before(() => {
    app = utils.createApp('controller-app');
    app.loader.loadAll();
    return app.ready();
  });
  after(() => app.close());

  describe('when controller is generator function', () => {

    it('should use it as middleware', () => {
      assert(app.controller.generatorFunction);

      return request(app.callback())
      .get('/generator-function')
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

    it('should get pathName from Controller', () => {
      return request(app.callback())
      .get('/class-pathname')
      .expect(200)
      .expect('controller.admin.config');
    });
  });

});
