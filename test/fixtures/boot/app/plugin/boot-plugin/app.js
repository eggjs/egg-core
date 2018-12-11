'use strict';
const sleep = require('mz-modules/sleep');
const assert = require('assert');

module.exports = app => {
  app.bootLog.push('app.js in plugin');
  // make sure app.js change app.config.appSet = true on configWillLoad
  assert(app.config.appSet === true);
  app.beforeStart(async () => {
    await sleep(5);
    app.bootLog.push('beforeStart');
  });

  app.ready(()=> {
    app.bootLog.push('ready');
  });
};
