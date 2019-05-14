'use strict';

const assert = require('assert');
const utils = require('../../utils');

describe('test/loader/mixin/load_custom_agent.test.js', function() {

  let agent;
  before(function() {
    agent = utils.createApp('plugin');
    agent.loader.loadPlugin();
    agent.loader.loadConfig();
    agent.loader.loadCustomAgent();
  });
  after(() => agent.close());

  it('should load agent.js', function() {
    assert(agent.b === 'plugin b');
    assert(agent.c === 'plugin c');
    assert(agent.agent === 'agent');
  });

  it('should agent.js of plugin before application\'s', function() {
    assert(agent.dateB <= agent.date);
    assert(agent.dateC <= agent.date);
  });

  it('should not load plugin that is disabled', function() {
    assert(!agent.a);
  });

  it('agent.js should not be class', () => {
    assert.throws(() => {
      const agent = utils.createApp('boot-class');
      agent.loader.loadPlugin();
      agent.loader.loadConfig();
      agent.loader.loadCustomAgent();
    }, /boot-class\/agent.js is not support class at this version/);
  });
});
