'use strict';

const co = require('co');
const is = require('is-type-of');
const path = require('path');
const fs = require('fs');

module.exports = {

  loadFile(filepath) {
    try {
      // if not js module, just return content buffer
      const extname = path.extname(filepath);
      if (![ '.js', '.node', '.json', '' ].includes(extname)) {
        return fs.readFileSync(filepath);
      }
      // require js module
      const obj = require(filepath);
      if (!obj) return obj;
      // it's es module
      if (obj.__esModule) return 'default' in obj ? obj.default : obj;
      return obj;
    } catch (err) {
      err.message = `[egg-core] load file: ${filepath}, error: ${err.message}`;
      throw err;
    }
  },

  resolveModule(filepath) {
    try {
      return require.resolve(filepath);
    } catch (e) {
      return undefined;
    }
  },

  methods: [ 'head', 'options', 'get', 'put', 'patch', 'post', 'delete' ],

  * callFn(fn, args) {
    args = args || [];
    if (!is.function(fn)) return;
    if (is.generatorFunction(fn)) {
      return yield fn(...args);
    }
    const r = fn(...args);
    if (is.promise(r)) {
      return yield r;
    }
    return r;
  },

  middleware(fn) {
    if (is.generatorFunction(fn)) return fn;

    // support async function
    return function* (next) {
      // next is a generator
      yield module.exports.callFn(fn, [ this, () => co(next) ]);
    };
  },

  getCalleeFromStack(withLine) {
    const limit = Error.stackTraceLimit;
    const prep = Error.prepareStackTrace;

    Error.prepareStackTrace = prepareObjectStackTrace;
    Error.stackTraceLimit = 4;

    // capture the stack
    const obj = {};
    Error.captureStackTrace(obj);
    let callSite = obj.stack[2];
    let fileName;
    /* istanbul ignore else */
    if (callSite) {
      // egg-mock will create a proxy
      // https://github.com/eggjs/egg-mock/blob/master/lib/app.js#L167
      fileName = callSite.getFileName();
      /* istanbul ignore if */
      if (fileName && fileName.endsWith('egg-mock/lib/app.js')) {
        // TODO: add test
        callSite = obj.stack[3];
        fileName = callSite.getFileName();
      }
    }

    Error.prepareStackTrace = prep;
    Error.stackTraceLimit = limit;

    /* istanbul ignore if */
    if (!callSite || !fileName) return '<anonymous>';
    if (!withLine) return fileName;
    return `${fileName}:${callSite.getLineNumber()}:${callSite.getColumnNumber()}`;
  },
};


/**
 * Capture call site stack from v8.
 * https://github.com/v8/v8/wiki/Stack-Trace-API
 */

function prepareObjectStackTrace(obj, stack) {
  return stack;
}
