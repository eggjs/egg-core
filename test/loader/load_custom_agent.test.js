'use strict';

const should = require('should');
const utils = require('../utils');

describe('test/load_custom_agent.test.js', function() {

  let agent;
  before(function() {
    agent = utils.createAgent('plugin');
  });

  it('should load agent.js', function() {
    agent.b.should.equal('plugin b');
    agent.c.should.equal('plugin c');
    agent.agent.should.equal('agent');
  });

  it('should agent.js of plugin before application\'s', function() {
    (agent.dateB <= agent.date).should.equal(true);
    (agent.dateC <= agent.date).should.equal(true);
  });

  it('should not load plugin that is disabled', function() {
    should.not.exists(agent.a);
  });
});
