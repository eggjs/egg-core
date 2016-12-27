'use strict';

const assert = require('assert');
const utils = require('../../utils');

describe('test/loader/mixin/load_application_extend.test.js', function() {

  let app;
  before(function() {
    app = utils.createApp('application');
    app.loader.loadPlugin();
    app.loader.loadConfig();
    app.loader.loadApplicationExtend();
  });
  after(() => app.close());

  it('should load extend from chair, plugin and application', function() {
    assert(app.poweredBy);
    assert(app.a);
    assert(app.b);
    assert(app.foo);
    assert(app.bar);
  });

  it('should override chair by plugin', function() {
    assert(app.a === 'plugin a');
    assert(app.b === 'plugin b');
    assert(app.poweredBy === 'plugin a');
  });

  it('should override plugin by app', function() {
    assert(app.foo === 'app bar');
    assert(app.bar === 'foo');
  });

});
