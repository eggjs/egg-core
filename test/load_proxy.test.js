'use strict';

const should = require('should');
const request = require('supertest');
const mm = require('mm');
const utils = require('./utils');

describe('test/load_proxy.test.js', function() {

  afterEach(mm.restore);

  it('should load from application, plugin', function(done) {
    const app = utils.createApp('plugin');
    should.exists(app.proxyClasses.couponQuery);
    should.exists(app.proxyClasses.userInfoQuery);
    should.exists(app.proxyClasses.onlyClassQuery);
    should.not.exists(app.proxyClasses.a);

    request(app.callback())
    .get('/proxy')
    .expect({
      coupon: { coupon: 100 },
      userInfo: { foo: 'bar' },
      onlyClass: { foo: 'clz' },
    })
    .end(done);
  });

  it('should throw when dulplicate', function() {
    (function() {
      utils.createApp('proxy-override');
    }).should.throw('can\'t overwrite property queryProxy');
  });

  describe('subdir', function() {

    it('should load 2 level dir', function(done) {
      const app = utils.createApp('subdir-proxy');
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
        proxyIsSame: true,
        oldStyle: '/',
      })
      .expect(200, done);
    });

  });

});
