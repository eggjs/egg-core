'use strict';

const assert = require('assert');
const request = require('supertest');
const utils = require('../../utils');

describe('test/loader/mixin/load_custom_loader.test.js', function() {
  let app;
  before(function() {
    app = utils.createApp('custom-loader');
    app.loader.loadPlugin();
    app.loader.loadConfig();
    app.loader.loadController();
    app.loader.loadRouter();
    app.loader.loadCustomLoader();
  });
  after(() => app.close());

  it('should load to app', async () => {
    const res = await app.adapter.docker.inspectDocker();
    assert(res);
    assert(res.inject === 'app');
  });

  it('should load to ctx', async () => {
    await request(app.callback())
      .get('/users/popomore')
      .expect({
        adapter: {
          directory: 'app/adapter',
          inject: 'app',
        },
        repository: 'popomore',
      })
      .expect(200);
  });

  it('sss', () => {
    app = utils.createApp('custom-loader');
    try {
      app.loader.loadCustomLoader();
      throw new Error('should not run');
    } catch (err) {
      assert(err.message === 'should loadConfig first');
    } finally {
      app.close();
    }
  });

});
