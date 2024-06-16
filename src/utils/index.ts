import { debuglog } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import BuiltinModule from 'node:module';
import { createRequire } from 'node:module';

const debug = debuglog('@eggjs/core:utils');

export type Fun = (...args: any[]) => any;

// Guard against poorly mocked module constructors.
const Module = typeof module !== 'undefined' && module.constructor.length > 1
  ? module.constructor
  /* istanbul ignore next */
  : BuiltinModule;

const extensions = (Module as any)._extensions;
const extensionNames = Object.keys(extensions).concat([ '.cjs', '.mjs' ]);
debug('Module extensions: %j', extensionNames);

let _customRequire: NodeRequire;
function getCustomRequire() {
  if (!_customRequire && typeof require === 'undefined') {
    _customRequire = createRequire(process.cwd());
    // _customRequire = createRequire(import.meta.url);
  }
  return _customRequire;
}

export default {
  deprecated(message: string) {
    console.warn('[@eggjs/core:deprecated] %s', message);
  },

  extensions,

  // async _importOrRequire(filepath: string) {
  //   // try import first
  //   let obj: any;
  //   try {
  //     obj = await import(filepath);
  //   } catch (err: any) {
  //     debug('await import error, use require instead, %s', err);
  //     // use custom require
  //     obj = getCustomRequire()(filepath);
  //   }
  //   return obj;
  // },

  async loadFile(filepath: string) {
    try {
      // if not js module, just return content buffer
      const extname = path.extname(filepath);
      if (extname && !extensionNames.includes(extname)) {
        return fs.readFileSync(filepath);
      }
      let obj: any;
      let isESM = false;
      if (typeof require === 'function') {
        // commonjs
        obj = require(filepath);
        debug('[loadFile] require %s => %o', filepath, obj);
        if (obj && obj.__esModule) {
          isESM = true;
        }
      } else {
        // esm
        debug('[loadFile] await import start: %s', filepath);
        obj = await import(filepath);
        debug('[loadFile] await import end: %s => %o', filepath, obj);
        isESM = true;
        if (obj && typeof obj === 'object' && 'default' in obj) {
          // default: { default: [Function (anonymous)] }
          obj = obj.default;
        }
      }
      if (!obj) return obj;
      // it's es module, use default export
      if (isESM && typeof obj === 'object') {
        obj = 'default' in obj ? obj.default : obj;
      }
      debug('[loadFile] return %s => %o', filepath, obj);
      return obj;
    } catch (e: any) {
      const err = new Error(`[@eggjs/core] load file: ${filepath}, error: ${e.message}`);
      err.cause = e;
      debug('[loadFile] handle %s error: %s', filepath, e);
      throw err;
    }
  },

  resolvePath(filepath: string, options?: { paths?: string[] }) {
    if (typeof require !== 'undefined') {
      return require.resolve(filepath, options);
    }
    return getCustomRequire().resolve(filepath, options);
  },

  methods: [ 'head', 'options', 'get', 'put', 'patch', 'post', 'delete' ],

  async callFn(fn: Fun, args?: any[], ctx?: any) {
    args = args || [];
    if (typeof fn !== 'function') return;
    return ctx ? fn.call(ctx, ...args) : fn(...args);
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
