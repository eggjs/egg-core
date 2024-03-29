const mm = require('mm');
const assert = require('assert');
const utils = require('../utils');

describe('test/loader/get_server_env.test.js', () => {
  let app;
  afterEach(mm.restore);
  afterEach(() => app.close());

  it('should get from env EGG_SERVER_ENV', () => {
    mm(process.env, 'EGG_SERVER_ENV', 'prod');
    app = utils.createApp('serverenv');
    assert(app.loader.serverEnv === 'prod');
  });
  it('should use test when EGG_SERVER_ENV = "test "', () => {
    mm(process.env, 'EGG_SERVER_ENV', 'test ');
    app = utils.createApp('serverenv');
    assert(app.loader.serverEnv === 'test');
  });
  it('should use unittest when NODE_ENV = test', () => {
    mm(process.env, 'NODE_ENV', 'test');
    app = utils.createApp('serverenv');
    assert(app.loader.serverEnv === 'unittest');
  });

  it('should use prod when NODE_ENV = production', () => {
    mm(process.env, 'NODE_ENV', 'production');
    app = utils.createApp('serverenv');
    assert(app.loader.serverEnv === 'prod');
  });

  it('should use local when NODE_ENV is other', () => {
    mm(process.env, 'NODE_ENV', 'development');
    app = utils.createApp('serverenv');
    assert(app.loader.serverEnv === 'local');
  });

  it('should get from config/env', () => {
    mm(process.env, 'NODE_ENV', 'production');
    mm(process.env, 'EGG_SERVER_ENV', 'test');
    app = utils.createApp('serverenv-file');
    assert(app.loader.serverEnv === 'prod');
  });

  it('should get from options.env', () => {
    app = utils.createApp('serverenv', { env: 'prod' });
    assert(app.loader.serverEnv === 'prod');
  });

  it('should use options.env first', () => {
    mm(process.env, 'EGG_SERVER_ENV', 'test');
    app = utils.createApp('serverenv-file', { env: 'development' });
    assert(app.loader.serverEnv === 'development');
  });
});
