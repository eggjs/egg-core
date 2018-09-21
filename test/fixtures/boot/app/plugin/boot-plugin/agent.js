'use strict';
const sleep = require('mz-modules/sleep');

module.exports = agent => {
  agent.bootLog.push('agent.js');
  agent.beforeStart(async () => {
    await sleep(5);
    agent.bootLog.push('beforeStart');
  });

  agent.ready(()=> {
    agent.bootLog.push('ready');
  });
};
