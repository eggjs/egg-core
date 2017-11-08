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
});
