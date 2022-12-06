'use strict';

const assert = require('assert');
const path = require('path');
const request = require('supertest');
const enableAsyncLocalStorage = !!require('async_hooks').AsyncLocalStorage;
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
    if (enableAsyncLocalStorage) {
      assert(res.body.traceId);
    }
    assert(app.currentContext === undefined);
  });
});
