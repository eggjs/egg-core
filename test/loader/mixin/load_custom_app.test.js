'use strict';

const should = require('should');
const utils = require('../../utils');

describe('test/loader/mixin/load_custom_app.test.js', function() {

  let app;
  before(function() {
    app = utils.createApp('plugin');
    app.loader.loadPlugin();
    app.loader.loadConfig();
    app.loader.loadCustomApp();
  });
  after(() => app.close());

  it('should load app.js', function() {
    app.b.should.equal('plugin b');
    app.c.should.equal('plugin c');
    app.app.should.equal('app');
  });

  it('should app.js of plugin before application\'s', function() {
    (app.dateB <= app.date).should.equal(true);
    (app.dateC <= app.date).should.equal(true);
  });

  it('should not load plugin that is disabled', function() {
    should.not.exists(app.a);
  });
});
