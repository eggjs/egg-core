'use strict';
const sleep = require('mz-modules/sleep');

module.exports = app => {
  app.bootLog.push('app.js');
  app.beforeStart(async () => {
    await sleep(5);
    app.bootLog.push('beforeStart');
  });

  app.ready(()=> {
    app.bootLog.push('ready');
  });
};
