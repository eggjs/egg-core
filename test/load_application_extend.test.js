'use strict';

const should = require('should');
const utils = require('./utils');

describe('test/load_application_extend.test.js', function() {

  let app;
  before(function() {
    app = utils.createApp('application');
  });

  it('应该加载 chair, plugin 和 app 的扩展', function() {
    should.exist(app.poweredBy);
    // should.exist(app.utils);
    // should.exist(app.inspect);
    should.exist(app.a);
    should.exist(app.b);
    should.exist(app.foo);
    should.exist(app.bar);
  });

  it('plugin 可以覆盖 chair', function() {
    app.a.should.equal('plugin a');
    app.b.should.equal('plugin b');
    app.poweredBy.should.equal('plugin a');
  });

  it('app 可以覆盖 plugin', function() {
    app.foo.should.equal('app bar');
    app.bar.should.equal('foo');
  });

});
