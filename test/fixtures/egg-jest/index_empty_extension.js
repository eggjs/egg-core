const path = require('path');
const mm = require('mm');
const assert = require('assert');
const util = require('../../../lib/utils');

Object.keys(require.extensions).forEach(ext => {
  delete require.extensions[ext];
});

assert(!!util.supportExtension('.js'), 'should support js ext');
