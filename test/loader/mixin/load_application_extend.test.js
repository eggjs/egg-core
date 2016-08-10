'use strict';

const should = require('should');
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
    should.exist(app.poweredBy);
    should.exist(app.a);
    should.exist(app.b);
    should.exist(app.foo);
    should.exist(app.bar);
  });

  it('should override chair by plugin', function() {
    app.a.should.equal('plugin a');
    app.b.should.equal('plugin b');
    app.poweredBy.should.equal('plugin a');
  });

  it('should override plugin by app', function() {
    app.foo.should.equal('app bar');
    app.bar.should.equal('foo');
  });

});
