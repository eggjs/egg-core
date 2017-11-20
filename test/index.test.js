'use strict';

const assert = require('assert');
const EggCore = require('..');

describe('test/index.test.js', () => {
  it('should expose properties', () => {
    assert(EggCore.EggCore);
    assert(EggCore.EggLoader);
    assert(EggCore.BaseContextClass);
    assert(EggCore.utils);
  });
});
