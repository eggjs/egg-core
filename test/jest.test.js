'use strict';

const path = require('path');
const assert = require('assert');
const coffee = require('coffee');

describe('test/jest.test.js', () => {
  it('should works without error with empty extensions', async () => {
    const { stderr } = await coffee
      .fork(require.resolve('./fixtures/egg-jest/index_empty_extension.js'), [], {
        cwd: path.resolve(__dirname, './fixtures/egg-jest'),
      })
      // .debug()
      .end();

    assert(!stderr);
  });

  it('should works without error with empty extensions with ts env', async () => {
    const { stderr } = await coffee
      .fork(
        require.resolve('ts-node/dist/bin'),
        [ require.resolve('./fixtures/egg-jest/index_empty_extension.js') ],
        {
          cwd: path.resolve(__dirname, './fixtures/egg-jest'),
          env: Object.assign({}, process.env, {
            EGG_TYPESCRIPT: 'true',
          }),
        }
      )
      .debug()
      .end();

    assert(!stderr);
  });

  it('should works without error with jest', async () => {
    const { stdout, stderr } = await coffee
      .fork(require.resolve('jest/bin/jest'), [], {
        cwd: path.resolve(__dirname, './fixtures/egg-jest'),
      })
      // .debug()
      .end();

    assert((stdout + stderr).includes('Test Suites: 1 passed, 1 total'));
  });
});
