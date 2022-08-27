'use strict';

const assert = require('assert');
const utils = require('./utils');

describe('test/config.test.js', () => {
  let app;
  after(() => app && app.close());

  it('should async config as expected', async () => {
    app = utils.createApp('async-config');
    app.loader.loadAll();
    await app.ready();
    assert.deepEqual(app.config.list, [ 1, 2, 3, 4, 5, 6 ]);
  });
});
