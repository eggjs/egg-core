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

  it('should support exports load to app', () => {
    assert(app.util.test.sayHi('egg') === 'hi, egg');
    assert(app.util.sub.fn.echo() === 'echo custom_loader');
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

  it('should support loadunit', async () => {
    let name = app.plugin.a.getName();
    assert(name === 'plugina');
    name = app.plugin.b.getName();
    assert(name === 'pluginb');
  });


  it('should loadConfig first', () => {
    const app = utils.createApp('custom-loader');
    try {
      app.loader.loadCustomLoader();
      throw new Error('should not run');
    } catch (err) {
      assert(err.message === 'should loadConfig first');
    } finally {
      app.close();
    }
  });

  it('support set directory', () => {
    const app = utils.createApp('custom-loader');
    try {
      app.loader.config = {
        customLoader: {
          custom: {
          },
        },
      };
      app.loader.loadCustomLoader();
      throw new Error('should not run');
    } catch (err) {
      assert(err.message === 'directory is required for config.customLoader.custom');
    } finally {
      app.close();
    }
  });

  it('inject support app/ctx', () => {
    const app = utils.createApp('custom-loader');
    try {
      app.loader.config = {
        customLoader: {
          custom: {
            directory: 'a',
            inject: 'unknown',
          },
        },
      };
      app.loader.loadCustomLoader();
      throw new Error('should not run');
    } catch (err) {
      assert(err.message === 'inject only support app or ctx');
    } finally {
      app.close();
    }
  });
});
