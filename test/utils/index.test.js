'use strict';

const mm = require('mm');
const utils = require('../../lib/utils');

describe('test/utils/index.test.js', () => {

  afterEach(mm.restore);

  describe('utils.getHomedir()', () => {
    it('should return process.env.HOME', () => {
      utils.getHomedir().should.equal(process.env.HOME);
    });

    it('should return /home/admin when process.env.HOME is not exist', () => {
      mm(process.env, 'HOME', '');
      utils.getHomedir().should.equal('/home/admin');
    });
  });
});
