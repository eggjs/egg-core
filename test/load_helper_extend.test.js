'use strict';

const request = require('supertest');
const utils = require('./utils');

describe('test/load_helper_extend.test.js', function() {

  let app;
  before(function() {
    app = utils.createApp('helper');
  });

  it('应该加载 app 和 plugin 的 helper 文件', function(done) {
    request(app.callback())
    .get('/')
    .expect(/app: true/)
    .expect(/plugin a: false/)
    .expect(/plugin b: true/)
    .expect(200, done);
  });

  it('app 的优先级高于 plugin', function(done) {
    request(app.callback())
    .get('/')
    .expect(/override: app/)
    .expect(200, done);
  });

  it('应该使用 helper 调用，无法直接调用', function(done) {
    request(app.callback())
    .get('/')
    .expect(/not exists on locals: false/)
    .expect(200, done);
  });

});
