'use strict';

const path = require('path');
const assert = require('assert');
const EggApplication = require('../').Application;

test('should works', async () => {
  const app = new EggApplication({
    baseDir: path.resolve(__dirname, '../'),
    type: 'application',
  });
  app.loader.loadAll();
  expect(!!app.Proxy).toBe(true);
  expect(!!app.config.urllib.keepAlive).toBe(true);
});
