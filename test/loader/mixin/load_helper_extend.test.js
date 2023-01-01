const request = require('supertest');
const utils = require('../../utils');

describe('test/loader/mixin/load_helper_extend.test.js', () => {
  describe('helper', () => {
    let app;
    before(() => {
      app = utils.createApp('helper');
      app.loader.loadPlugin();
      app.loader.loadConfig();
      app.loader.loadApplicationExtend();
      app.loader.loadContextExtend();
      app.loader.loadHelperExtend();
      app.loader.loadController();
      app.loader.loadRouter();
    });
    after(() => app.close());

    it('should load extend from chair, plugin and helper', async () => {
      await request(app.callback())
        .get('/')
        .expect(/app: true/)
        .expect(/plugin a: false/)
        .expect(/plugin b: true/)
        .expect(200);
    });

    it('should override chair by application', async () => {
      await request(app.callback())
        .get('/')
        .expect(/override: app/)
        .expect(200);
    });

    it('should not call directly', async () => {
      await request(app.callback())
        .get('/')
        .expect(/not exists on locals: false/)
        .expect(200);
    });
  });

  describe('no Helper', () => {
    let app;
    after(() => app.close());

    it('should not extend helper', () => {
      app = utils.createApp('no-helper');
      // should not throw
      app.loader.loadHelperExtend();
    });
  });
});
