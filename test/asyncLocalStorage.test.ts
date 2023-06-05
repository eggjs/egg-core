import { strict as assert } from 'node:assert';
import path from 'node:path';
import request from 'supertest';
import { getAsyncLocalStorage, kGALS } from 'gals';
import { Application } from './fixtures/egg';

describe('test/asyncLocalStorage.test.ts', () => {
  let app: Application;
  before(() => {
    app = new Application({
      baseDir: path.join(__dirname, 'fixtures/session-cache-app'),
      type: 'application',
    });
    app.loader.loadAll();
  });

  it('should start app with asyncLocalStorage = true by default', async () => {
    assert.equal(app.currentContext, undefined);
    const res = await request(app.callback())
      .get('/');
    assert.equal(res.status, 200);
    // console.log(res.body);
    assert.equal(res.body.sessionId, 'mock-session-id-123');
    assert(res.body.traceId);
    assert.equal(app.currentContext, undefined);
  });

  it('should access als on global', async () => {
    assert(global[Symbol.for('gals#asyncLocalStorage')]);
    assert(global[kGALS]);
    assert(global[Symbol.for('gals#asyncLocalStorage')] instanceof AsyncLocalStorage);
    assert.equal(app.ctxStorage, global[Symbol.for('gals#asyncLocalStorage')]);
    assert.equal(app.ctxStorage, getAsyncLocalStorage());
  });
});
