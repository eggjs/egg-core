import { strict as assert } from 'node:assert';
import * as EggCore from '..';

describe('test/index.test.ts', () => {
  it('should expose properties', () => {
    assert(EggCore.EggCore);
    assert(EggCore.EggLoader);
    assert(EggCore.BaseContextClass);
    assert(EggCore.utils);
  });
});
