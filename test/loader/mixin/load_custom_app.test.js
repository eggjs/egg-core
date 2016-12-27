'use strict';

const assert = require('assert');
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
      assert(app.b === 'plugin b');
      assert(app.c === 'plugin c');
      assert(app.app === 'app');
    });

    it('should app.js of plugin before application\'s', () => {
      assert(app.dateB <= app.date);
      assert(app.dateC <= app.date);
    });

    it('should not load plugin that is disabled', () => {
      assert(!app.a);
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
      assert(app.app === true);
    });
  });

  describe('app.js as function return generator function', () => {
    let app;
    before(done => {
      app = utils.createApp('custom-app-generator');
      app.loader.loadPlugin();
      app.loader.loadConfig();
      app.loader.loadCustomApp();
      app.ready(done);
    });
    after(() => app.close());

    it('should load app.js success', () => {
      assert(app.app === true);
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
      assert(app.app === true);
    });
  });


  describe('app.js load async error', () => {
    let app;
    after(() => app.close());

    it('should load app.js success', done => {
      app = utils.createApp('custom-app-error');
      app.on('error', err => {
        assert(err.message === 'load async error');
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
