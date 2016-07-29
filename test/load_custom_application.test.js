'use strict';

const should = require('should');
const utils = require('./utils');

describe('test/load_custom_app.test.js', function() {

  let app;
  before(function() {
    app = utils.createApp('plugin');
  });

  it('正确加载 app.js', function() {
    app.b.should.equal('plugin b');
    app.c.should.equal('plugin c');
    app.app.should.equal('app');
  });

  it('插件 app 优先于应用 app 加载', function() {
    (app.dateB <= app.date).should.equal(true);
    (app.dateC <= app.date).should.equal(true);
  });

  it('不加载未开启的插件', function() {
    should.not.exists(app.a);
  });
});
