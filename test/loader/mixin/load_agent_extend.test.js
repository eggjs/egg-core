'use strict';

const assert = require('assert');
const utils = require('../../utils');

describe('test/loader/mixin/load_agent_extend.test.js', function() {

  let agent;
  before(function() {
    agent = utils.createApp('agent');
    agent.loader.loadPlugin();
    agent.loader.loadConfig();
    agent.loader.loadAgentExtend();
  });
  after(() => agent.close());

  it('should load extend from chair, plugin and agent', function() {
    assert(agent.poweredBy);
    assert(agent.a);
    assert(agent.b);
    assert(agent.foo);
    assert(agent.bar);
  });

  it('should override chair by plugin', function() {
    assert(agent.a === 'plugin a');
    assert(agent.b === 'plugin b');
    assert(agent.poweredBy === 'plugin a');
  });

  it('should override plugin by agent', function() {
    assert(agent.foo === 'agent bar');
    assert(agent.bar === 'foo');
  });

});
