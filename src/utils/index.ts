import { debuglog } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import BuiltinModule from 'node:module';
import { isGeneratorFunction } from 'is-type-of';

const debug = debuglog('egg-core:utils');

export type Fun = (...args: any[]) => any;

// Guard against poorly mocked module constructors.
const Module = typeof module !== 'undefined' && module.constructor.length > 1
  ? module.constructor
  /* istanbul ignore next */
  : BuiltinModule;

const extensions = (Module as any)._extensions;
debug('Module extensions: %j', Object.keys(extensions));

export default {
  extensions,

  async loadFile(filepath: string) {
    try {
      // if not js module, just return content buffer
      const extname = path.extname(filepath);
      if (extname && !extensions[extname]) {
        return fs.readFileSync(filepath);
      }
      let obj: any;
      let isESM = false;
      if (typeof require === 'function') {
        // commonjs
        obj = require(filepath);
        debug('require %s => %o', filepath, obj);
        if (obj && obj.__esModule) {
          isESM = true;
        }
      } else {
        // esm
        obj = await import(filepath);
        debug('await import %s => %o', filepath, obj);
        isESM = true;
        if (obj && 'default' in obj) {
          // default: { default: [Function (anonymous)] }
          obj = obj.default;
        }
      }
      if (!obj) return obj;
      // it's es module, use default export
      if (isESM) return 'default' in obj ? obj.default : obj;
      return obj;
    } catch (err: any) {
      err.message = `[@eggjs/core] load file: ${filepath}, error: ${err.message}`;
      throw err;
    }
  },

  methods: [ 'head', 'options', 'get', 'put', 'patch', 'post', 'delete' ],

  async callFn(fn: Fun, args?: any[], ctx?: any) {
    args = args || [];
    if (typeof fn !== 'function') return;
    if (isGeneratorFunction(fn)) {
      throw new TypeError(`Support for generators was removed, function: ${fn.toString()}`);
    }
    return ctx ? fn.call(ctx, ...args) : fn(...args);
  },

  middleware(fn: any) {
    if (isGeneratorFunction(fn)) {
      throw new TypeError(`Support for generators was removed, middleware: ${fn.toString()}`);
    }
    return fn;
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
function prepareObjectStackTrace(_obj: any, stack: any) {
  return stack;
}
