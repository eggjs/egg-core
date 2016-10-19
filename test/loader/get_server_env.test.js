'use strict';

require('should');
const mm = require('mm');
const utils = require('../utils');

describe('test/loader/get_server_env.test.js', function() {

  let app;
  afterEach(mm.restore);
  afterEach(() => app.close());

  it('should get from env EGG_SERVER_ENV', function() {
    mm(process.env, 'EGG_SERVER_ENV', 'prod');
    app = utils.createApp('serverenv');
    app.loader.serverEnv.should.equal('prod');
  });

  it('should use unittest when NODE_ENV = test', function() {
    mm(process.env, 'NODE_ENV', 'test');
    app = utils.createApp('serverenv');
    app.loader.serverEnv.should.equal('unittest');
  });

  it('should use prod when NODE_ENV = production', function() {
    mm(process.env, 'NODE_ENV', 'production');
    app = utils.createApp('serverenv');
    app.loader.serverEnv.should.equal('prod');
  });

  it('should use local when NODE_ENV is other', function() {
    mm(process.env, 'NODE_ENV', 'development');
    app = utils.createApp('serverenv');
    app.loader.serverEnv.should.equal('local');
  });

  it('should get from config/serverEnv', function() {
    mm(process.env, 'NODE_ENV', 'production');
    mm(process.env, 'EGG_SERVER_ENV', 'test');
    app = utils.createApp('serverenv-file');
    app.loader.serverEnv.should.equal('prod');
  });

});
