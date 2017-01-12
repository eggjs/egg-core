'use strict';

const assert = require('assert');

module.exports = app => {
  app.isReady = true;
  app.beforeStart(function*() {
    if (!app.isReady) throw new Error('not ready');
  });
  app.isReady = false;
};
