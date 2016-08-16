'use strict';

const should = require('should');
const utils = require('../utils');

describe('test/loader/egg_loader.test.js', () => {

  let app;
  before(() => {
    app = utils.createApp('nothing');
  });

  it('should container FileLoader and ContextLoader', () => {
    should.exists(app.loader.FileLoader);
    should.exists(app.loader.ContextLoader);
  });

});
