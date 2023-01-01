const assert = require('assert');
const utils = require('../../utils');

describe('test/loader/mixin/load_custom_agent.test.js', () => {
  let agent;
  before(() => {
    agent = utils.createApp('plugin');
    agent.loader.loadPlugin();
    agent.loader.loadConfig();
    agent.loader.loadCustomAgent();
  });
  after(() => agent.close());

  it('should load agent.js', () => {
    assert(agent.b === 'plugin b');
    assert(agent.c === 'plugin c');
    assert(agent.agent === 'agent');
  });

  it('should agent.js of plugin before application\'s', () => {
    assert(agent.dateB <= agent.date);
    assert(agent.dateC <= agent.date);
  });

  it('should not load plugin that is disabled', () => {
    assert(!agent.a);
  });
});
