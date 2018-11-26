'use strict';

const mm = require('mm');
const path = require('path');
const assert = require('assert');
const utils = require('../lib/utils');
const { fork } = require('child_process');

describe('test/jest.test.js', () => {
  afterEach(mm.restore);

  it('should has default extensions if require.extension is empty', () => {
    const extensions = {};
    Object.keys(require.extensions).forEach(ext => {
      extensions[ext] = require.extensions[ext];
      delete require.extensions[ext];
    });
    mm(process.env, 'EGG_TYPESCRIPT', 'true');
    assert(utils.extensions.length > 0);
    assert(utils.extensions.includes('.ts'));
    Object.keys(extensions).forEach(ext => {
      require.extensions[ext] = extensions[ext];
    });
  });

  it('should works without error with jest', done => {
    const proc = fork(require.resolve('jest/bin/jest'), [], {
      cwd: path.resolve(__dirname, './fixtures/egg-jest'),
      stdio: 'pipe',
    });

    let infoMsg = '';
    proc.stderr.on('data', chunk => (infoMsg += chunk.toString()));
    proc.stdout.on('data', chunk => (infoMsg += chunk.toString()));
    proc.on('exit', () => {
      assert(infoMsg.includes('Test Suites: 1 passed, 1 total'));
      done();
    });
  });
});
