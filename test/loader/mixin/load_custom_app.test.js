'use strict';

const should = require('should');
const utils = require('../../utils');

describe('test/loader/mixin/load_custom_app.test.js', () => {

  describe('app.js as function', () => {
    let app;
    before(() => {
      app = utils.createApp('plugin');
      app.loader.loadPlugin();
      app.loader.loadConfig();
      app.loader.loadCustomApp();
    });
    after(() => app.close());

    it('should load app.js', () => {
      app.b.should.equal('plugin b');
      app.c.should.equal('plugin c');
      app.app.should.equal('app');
    });

    it('should app.js of plugin before application\'s', () => {
      (app.dateB <= app.date).should.equal(true);
      (app.dateC <= app.date).should.equal(true);
    });

    it('should not load plugin that is disabled', () => {
      should.not.exists(app.a);
    });
  });

  describe('app.js as function return promise', () => {
    let app;
    before(done => {
      app = utils.createApp('custom-app-promise');
      app.loader.loadPlugin();
      app.loader.loadConfig();
      app.loader.loadCustomApp();
      app.ready(done);
    });
    after(() => app.close());

    it('should load app.js success', () => {
      app.app.should.be.true();
    });
  });

  describe('app.js as async function', () => {
    let app;
    before(done => {
      app = utils.createApp('custom-app-async-function');
      app.loader.loadPlugin();
      app.loader.loadConfig();
      app.loader.loadCustomApp();
      app.ready(done);
    });
    after(() => app.close());

    it('should load app.js success', () => {
      app.app.should.be.true();
    });
  });


  describe('app.js load async error', () => {
    let app;
    after(() => app.close());

    it('should load app.js success', done => {
      app = utils.createApp('custom-app-error');
      app.on('error', err => {
        err.message.should.eql('load async error');
        done();
      });
      app.loader.loadPlugin();
      app.loader.loadConfig();
      app.loader.loadCustomApp();
      app.ready(() => {
        throw new Error('should not call');
      });
    });
  });
});
