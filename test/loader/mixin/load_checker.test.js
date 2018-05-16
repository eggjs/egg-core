'use strict';

const utils = require('../../utils');
const assert = require('assert');

describe('test/loader/mixin/load_checker.test.js', () => {
  let app;

  beforeEach(() => {
    app = utils.createApp('checker-app');
  });

  afterEach(() => {
    return app.close();
  });

  it('should load checker', async () => {
    app.loader.loadAll();
    await app.ready();
    assert.strictEqual(app.readyQueue.length, 9);
    const first = app.readyQueue.shift();
    const end = app.readyQueue.pop();
    assert.strictEqual(first, 'beforeStart');
    assert.strictEqual(end, 'ready');
  });
});
