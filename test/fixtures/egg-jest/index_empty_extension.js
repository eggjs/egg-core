const path = require('path');
const mm = require('mm');
const assert = require('assert');
const util = require('../../../lib/utils');

Object.keys(require.extensions).forEach(ext => {
  delete require.extensions[ext];
});

let result;
if (process.env.EGG_TYPESCRIPT === 'true') {
  result = util.supportExtension('.ts');
} else {
  result = util.supportExtension('.js');
}

assert(!!result, 'should support ext');
