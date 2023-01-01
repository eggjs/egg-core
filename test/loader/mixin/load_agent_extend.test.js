const assert = require('assert');
const utils = require('../../utils');

describe('test/loader/mixin/load_agent_extend.test.js', () => {
  let agent;
  before(() => {
    agent = utils.createApp('agent');
    agent.loader.loadPlugin();
    agent.loader.loadConfig();
    agent.loader.loadAgentExtend();
  });
  after(() => agent.close());

  it('should load extend from chair, plugin and agent', () => {
    assert(agent.poweredBy);
    assert(agent.a);
    assert(agent.b);
    assert(agent.foo);
    assert(agent.bar);
  });

  it('should override chair by plugin', () => {
    assert(agent.a === 'plugin a');
    assert(agent.b === 'plugin b');
    assert(agent.poweredBy === 'plugin a');
  });

  it('should override plugin by agent', () => {
    assert(agent.foo === 'agent bar');
    assert(agent.bar === 'foo');
  });
});
