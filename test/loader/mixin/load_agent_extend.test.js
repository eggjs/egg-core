'use strict';

const should = require('should');
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
    should.exist(agent.poweredBy);
    should.exist(agent.a);
    should.exist(agent.b);
    should.exist(agent.foo);
    should.exist(agent.bar);
  });

  it('should override chair by plugin', function() {
    agent.a.should.equal('plugin a');
    agent.b.should.equal('plugin b');
    agent.poweredBy.should.equal('plugin a');
  });

  it('should override plugin by agent', function() {
    agent.foo.should.equal('agent bar');
    agent.bar.should.equal('foo');
  });

});
