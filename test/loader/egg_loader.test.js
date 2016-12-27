'use strict';

const assert = require('assert');
const utils = require('../utils');

describe('test/loader/egg_loader.test.js', () => {

  let app;
  before(() => {
    app = utils.createApp('nothing');
  });

  it('should container FileLoader and ContextLoader', () => {
    assert(app.loader.FileLoader);
    assert(app.loader.ContextLoader);
  });

});
