'use strict';

require('should');
const mm = require('mm');
const utils = require('./utils');

describe('test/get_server_env.test.js', function() {

  afterEach(mm.restore);

  it('should get from env EGG_SERVER_ENV', function() {
    mm(process.env, 'EGG_SERVER_ENV', 'prod');
    const app = utils.createApp('serverenv');
    app.loader.serverEnv.should.equal('prod');
  });

  it('should use unittest when NODE_ENV = test', function() {
    mm(process.env, 'NODE_ENV', 'test');
    const app = utils.createApp('serverenv');
    app.loader.serverEnv.should.equal('unittest');
  });

  it('should use default when NODE_ENV = production', function() {
    mm(process.env, 'NODE_ENV', 'production');
    const app = utils.createApp('serverenv');
    app.loader.serverEnv.should.equal('default');
  });

  it('should use local when NODE_ENV is other', function() {
    mm(process.env, 'NODE_ENV', 'development');
    const app = utils.createApp('serverenv');
    app.loader.serverEnv.should.equal('local');
  });

  it('should get from config/serverEnv', function() {
    mm(process.env, 'NODE_ENV', 'production');
    mm(process.env, 'EGG_SERVER_ENV', 'test');
    const app = utils.createApp('serverenv-file');
    app.loader.serverEnv.should.equal('prod');
  });

});
