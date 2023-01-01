const { sleep } = require('../../../../../utils');

module.exports = agent => {
  agent.bootLog.push('agent.js in plugin');
  agent.beforeStart(async () => {
    await sleep(5);
    agent.bootLog.push('beforeStart');
  });

  agent.ready(()=> {
    agent.bootLog.push('ready');
  });
};
