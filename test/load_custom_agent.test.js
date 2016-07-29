'use strict';

const should = require('should');
const utils = require('./utils');

describe('test/load_custom_agent.test.js', function() {

  let agent;
  before(function() {
    agent = utils.createAgent('plugin');
  });

  it('正确加载 agent.js', function() {
    agent.b.should.equal('plugin b');
    agent.c.should.equal('plugin c');
    agent.agent.should.equal('agent');
  });

  it('插件 agent 优先于应用 agent 加载', function() {
    (agent.dateB <= agent.date).should.equal(true);
    (agent.dateC <= agent.date).should.equal(true);
  });

  it('不加载未开启的插件', function() {
    should.not.exists(agent.a);
  });
});
