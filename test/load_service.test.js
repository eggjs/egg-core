'use strict';

const should = require('should');
const request = require('supertest');
const mm = require('mm');
const utils = require('./utils');

describe('test/load_service.test.js', function() {
  afterEach(mm.restore);

  it('should load from application and plugin', function(done) {
    const app = utils.createApp('plugin');
    console.log(app.serviceClasses);
    should.exists(app.serviceClasses.foo);
    should.exists(app.serviceClasses.foo2);
    should.not.exists(app.serviceClasses.bar1);
    should.exists(app.serviceClasses.bar2);
    should.exists(app.serviceClasses.foo4);

    request(app.callback())
    .get('/')
    .expect({
      foo2: 'foo2',
      foo3: 'foo3',
      foo4: true,
      foo5: true,
      foo: true,
      bar2: true,
    })
    .expect(200, done);
  });

  it('should throw when dulplicate', function() {
    (function() {
      utils.createApp('service-override');
    }).should.throw('can\'t overwrite property foo');
  });

  it('should check es6', function() {
    const app = utils.createApp('services_loader_verify');
    app.serviceClasses.should.have.property('foo');
    app.serviceClasses.foo.should.have.properties('bar', 'bar1', 'aa');
  });

  it('should extend app.Service', function(done) {
    const app = utils.createApp('extends-app-service');
    request(app.callback())
    .get('/user')
    .expect(function(res) {
      res.body.user.should.eql('123mock');
    })
    .expect(200, done);
  });

  describe('subdir', function() {

    it('should load 2 level dir', function(done) {
      mm(process.env, 'NO_DEPRECATION', '*');
      const app = utils.createApp('subdir-services');
      request(app.callback())
      .get('/')
      .expect({
        user: {
          uid: '123',
        },
        cif: {
          uid: '123cif',
          cif: true,
        },
        bar1: {
          name: 'bar1name',
          bar: 'bar1',
        },
        bar2: {
          name: 'bar2name',
          bar: 'bar2',
        },
        'foo.subdir2.sub2': {
          name: 'bar3name',
          bar: 'bar3',
        },
        subdir11bar: false,
        ok: {
          ok: true,
        },
        cmd: {
          cmd: 'hihi',
          method: 'GET',
          url: '/',
        },
        serviceIsSame: true,
        oldStyle: '/',
      })
      .expect(200, done);
    });

  });
});
