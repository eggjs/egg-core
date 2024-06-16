import { strict as assert } from 'node:assert';
import * as EggCore from '../src/index.js';

describe('test/index.test.ts', () => {
  it('should expose properties', () => {
    console.log(EggCore);
    assert(EggCore.EggCore);
    assert(EggCore.EggLoader);
    assert(EggCore.BaseContextClass);
    assert(EggCore.utils);
  });
});
