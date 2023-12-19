const assert = require('assert');
const path = require('path');
const { AsyncLocalStorage } = require('async_hooks');
const request = require('supertest');
const { getAsyncLocalStorage, kGALS } = require('gals');
const EggApplication = require('./fixtures/egg').Application;

describe('test/asyncLocalStorage.test.js', () => {
  let app;
  before(() => {
    app = new EggApplication({
      baseDir: path.join(__dirname, 'fixtures/session-cache-app'),
      type: 'application',
    });
    app.loader.loadAll();
  });

  it('should start app with asyncLocalStorage = true by default', async () => {
    assert(app.currentContext === undefined);
    const res = await request(app.callback())
      .get('/');
    assert(res.status === 200);
    console.log(res.body);
    assert(res.body.sessionId === 'mock-session-id-123');
    assert(res.body.traceId);
    assert(app.currentContext === undefined);
  });

  it('should access als on global', async () => {
    assert(global[Symbol.for('gals#asyncLocalStorage')]);
    assert(global[kGALS]);
    assert(global[Symbol.for('gals#asyncLocalStorage')] instanceof AsyncLocalStorage);
    assert.equal(app.ctxStorage, global[Symbol.for('gals#asyncLocalStorage')]);
    assert.equal(app.ctxStorage, getAsyncLocalStorage());
  });
});
