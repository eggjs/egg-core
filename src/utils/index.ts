import path from 'node:path';
import fs from 'node:fs';
import BuiltinModule from 'node:module';
import convert from 'koa-convert';
import is from 'is-type-of';
import co from 'co';

export type Fun = (...args: any[]) => any;

// Guard against poorly mocked module constructors.
const Module = module.constructor.length > 1
  ? module.constructor
  /* istanbul ignore next */
  : BuiltinModule;

export default {
  extensions: (Module as any)._extensions,

  loadFile(filepath: string) {
    try {
      // if not js module, just return content buffer
      const extname = path.extname(filepath);
      if (extname && !(Module as any)._extensions[extname]) {
        return fs.readFileSync(filepath);
      }
      // require js module
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const obj = require(filepath);
      if (!obj) return obj;
      // it's es module
      if (obj.__esModule) return 'default' in obj ? obj.default : obj;
      return obj;
    } catch (err) {
      err.message = `[@eggjs/core] load file: ${filepath}, error: ${err.message}`;
      throw err;
    }
  },

  methods: [ 'head', 'options', 'get', 'put', 'patch', 'post', 'delete' ],

  async callFn(fn: Fun, args?: any[], ctx?: any) {
    args = args || [];
    if (typeof fn !== 'function') return;
    if (is.generatorFunction(fn)) fn = co.wrap(fn);
    return ctx ? fn.call(ctx, ...args) : fn(...args);
  },

  middleware(fn: any) {
    return is.generatorFunction(fn) ? convert(fn) : fn;
  },

  getCalleeFromStack(withLine?: boolean, stackIndex?: number) {
    stackIndex = stackIndex === undefined ? 2 : stackIndex;
    const limit = Error.stackTraceLimit;
    const prep = Error.prepareStackTrace;

    Error.prepareStackTrace = prepareObjectStackTrace;
    Error.stackTraceLimit = 5;

    // capture the stack
    const obj: any = {};
    Error.captureStackTrace(obj);
    let callSite = obj.stack[stackIndex];
    let fileName = '';
    if (callSite) {
      // egg-mock will create a proxy
      // https://github.com/eggjs/egg-mock/blob/master/lib/app.js#L174
      fileName = callSite.getFileName();
      /* istanbul ignore if */
      if (fileName && fileName.endsWith('egg-mock/lib/app.js')) {
        // TODO: add test
        callSite = obj.stack[stackIndex + 1];
        fileName = callSite.getFileName();
      }
    }

    Error.prepareStackTrace = prep;
    Error.stackTraceLimit = limit;

    if (!callSite || !fileName) return '<anonymous>';
    if (!withLine) return fileName;
    return `${fileName}:${callSite.getLineNumber()}:${callSite.getColumnNumber()}`;
  },

  getResolvedFilename(filepath: string, baseDir: string) {
    const reg = /[/\\]/g;
    return filepath.replace(baseDir + path.sep, '').replace(reg, '/');
  },
};


/**
 * Capture call site stack from v8.
 * https://github.com/v8/v8/wiki/Stack-Trace-API
 */

function prepareObjectStackTrace(_obj, stack) {
  return stack;
}
