'use strict';

const should = require('should');
const request = require('supertest');
const mm = require('mm');
const utils = require('./utils');

describe('test/load_proxy.test.js', function() {

  afterEach(mm.restore);

  it('应该加载应用和插件的 proxy', function(done) {
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

  it('当重复加载时报错', function() {
    (function() {
      utils.createApp('proxy-override');
    }).should.throw('can\'t overwrite property queryProxy');
  });

  it('可以通过 ${appname}.tr.service.enable 控制是否创建 consumer', function() {
    const app = utils.createApp('plugin');
    should.not.exists(app.proxyClasses.b);
  });

  // TODO: 应该移到 hsf 中
  it.skip('should not ready when hsf throw error', function(done) {
    mm(process.env, 'NODE_ENV', 'development');
    const app = utils.createApp('proxy-error');
    app.hsfClient.on('error', function(err) {
      should.exists(err);
      err.message.should.eql('com.alipay.personalproxy.service.acctrans.noprovider:1.0:SOFA has no providers');
      setTimeout(done, 1000);
    });
    app.ready(function() {
      throw new Error('should not run this');
    });
  });

  it.skip('should ready when set app.ignore.proxy', function(done) {
    mm(process.env, 'NODE_ENV', 'development');
    const app = utils.createApp('proxy-ignore-error');
    app.ready(done);
  });

  describe('支持子目录', function() {

    it('支持一，二级目录，自动过滤超过二级的目录', function(done) {
      mm(process.env, 'NO_DEPRECATION', '*');
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
