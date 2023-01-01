const request = require('supertest');
const path = require('path');
const utils = require('../utils');

describe('test/loader/context_loader.test.js', () => {
  let app;
  before(() => {
    app = utils.createApp('context-loader');
    app.loader.loadAll();
  });

  it('should load files ', async () => {
    const directory = path.join(__dirname, '../fixtures/context-loader/app/depth');
    app.loader.loadToContext(directory, 'depth');

    await request(app.callback())
      .get('/depth')
      .expect({
        one: 'context:one',
        two: 'context:two',
        three: 'context:three',
        four: 'context:four',
      })
      .expect(200);
  });

  it('should load different types', async () => {
    const directory = path.join(__dirname, '../fixtures/context-loader/app/type');
    app.loader.loadToContext(directory, 'type');

    await request(app.callback())
      .get('/type')
      .expect({
        class: 'context',
        functionClass: 'context:config',
        generator: 'generator',
        object: 'object.get',
        number: 1,
      })
      .expect(200);
  });

  it('should use different cache key', async () => {
    const service1Dir = path.join(__dirname, '../fixtures/context-loader/app/service1');
    app.loader.loadToContext(service1Dir, 'service1');
    const service2Dir = path.join(__dirname, '../fixtures/context-loader/app/service2');
    app.loader.loadToContext(service2Dir, 'service2');

    await request(app.callback())
      .get('/service')
      .expect({
        service1: 'service1',
        service2: 'service2',
      })
      .expect(200);
  });

  it('should load file with pathname and config', async () => {
    const directory = path.join(__dirname, '../fixtures/context-loader/app/pathname');
    app.loader.loadToContext(directory, 'pathname');

    await request(app.callback())
      .get('/pathname')
      .expect('pathname.a.b.c')
      .expect(200);

    await request(app.callback())
      .get('/config')
      .expect('config')
      .expect(200);
  });

  it('should load file with service', () => {
    return request(app.callback())
      .get('/BaseContextClass/service')
      .expect('user:post')
      .expect(200);
  });
});
