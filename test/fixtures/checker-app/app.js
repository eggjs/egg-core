'use strict';

const sleep = require('mz-modules/sleep');

module.exports = function(app) {
  app.readyQueue = [];
  app.beforeStart(async () => {
    await sleep(20);
    app.readyQueue.push('beforeStart');
  });
  app.ready(() => {
    app.readyQueue.push('ready');
  });
};
