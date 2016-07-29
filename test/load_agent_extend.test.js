'use strict';

const should = require('should');
const utils = require('./utils');

describe('test/load_agent_extend.test.js', function() {

  let agent;
  before(function() {
    agent = utils.createAgent('agent');
  });

  it('应该加载 chair, plugin 和 agent 的扩展', function() {
    should.exist(agent.poweredBy);
    // should.exist(agent.utils);
    // should.exist(agent.inspect);
    should.exist(agent.a);
    should.exist(agent.b);
    should.exist(agent.foo);
    should.exist(agent.bar);
  });

  it('plugin 可以覆盖 chair', function() {
    agent.a.should.equal('plugin a');
    agent.b.should.equal('plugin b');
    agent.poweredBy.should.equal('plugin a');
  });

  it('agent 可以覆盖 plugin', function() {
    agent.foo.should.equal('agent bar');
    agent.bar.should.equal('foo');
  });

});
