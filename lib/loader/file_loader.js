'use strict';

const assert = require('assert');
const fs = require('fs');
const debug = require('debug')('egg-core:loader');
const path = require('path');
const globby = require('globby');
const is = require('is-type-of');
const loadFile = require('../utils').loadFile;
// Symbol.for ?
const FULLPATH = Symbol('EGG_LOADER_ITEM_FULLPATH');
const EXPORTS = Symbol('EGG_LOADER_ITEM_EXPORTS');

const defaults = {
  directory: null,
  target: null,
  ignore: undefined,
  lowercaseFirst: false,
  initializer: null,
  call: true,
  override: false,
  inject: undefined,
};

class FileLoader {

  constructor(options) {
    assert(options.directory, 'options.directory is required');
    assert(options.target, 'options.target is required');
    this.options = Object.assign({}, defaults, options);
  }

  load() {
    const items = this.parse();
    const target = this.options.target;
    for (const item of items) {
      debug('loading item %j', item);
      // item { properties: [ 'a', 'b', 'c'], exports }
      // => target.a.b.c = exports
      item.properties.reduce((target, property, index) => {
        let obj;
        const properties = item.properties.slice(0, index + 1).join('.');
        if (index === item.properties.length - 1) {
          if (property in target) {
            if (!this.options.override) throw new Error(`can't overwrite property '${properties}' from ${target[property][FULLPATH]} by ${item.fullpath}`);
          }
          obj = item.exports;
          if (obj && !is.primitive(obj)) {
            obj[FULLPATH] = item.fullpath;
            obj[EXPORTS] = true;
          }
        } else {
          obj = target[property] || {};
        }
        target[property] = obj;
        debug('loaded %s', properties);
        return obj;
      }, target);
    }
    return target;
  }

  parse() {
    const files = [ '**/*.js' ];
    if (typeof this.options.ignore === 'string') {
      files.push('!' + this.options.ignore);
    }

    let directories = this.options.directory;
    if (!Array.isArray(directories)) {
      directories = [ directories ];
    }

    const items = [];
    debug('parsing %j', directories);
    for (const directory of directories) {
      const filepaths = globby.sync(files, { cwd: directory });
      for (const filepath of filepaths) {
        const fullpath = path.join(directory, filepath);
        if (!fs.statSync(fullpath).isFile()) {
          continue;
        }
        const properties = getProperties(filepath, this.options.lowercaseFirst);
        const exports = getExports(fullpath, this.options.initializer, this.options.call, this.options.inject);
        if (exports == null) continue;
        items.push({ fullpath, properties, exports });
        debug('parse %s, properties %j, export %j', fullpath, properties, exports);
      }
    }

    return items;
  }

}

module.exports = FileLoader;
module.exports.EXPORTS = EXPORTS;

// a/b/c.js => ['a', 'b', 'c']
function getProperties(filepath, lowercaseFirst) {
  return filepath
  .replace('.js', '')
  .split('/')
  .map(property => {
    if (!/^[a-z][a-z0-9_-]*$/i.test(property)) {
      throw new Error(`${property} is not match 'a-z0-9_-' in ${filepath}`);
    }
    let result = property.replace(/[_-][a-z]/ig, s => s.substring(1).toUpperCase());
    if (lowercaseFirst) {
      result = result[0].toLowerCase() + result.substring(1);
    }
    return result;
  });
}

// Get exports from filepath
// If exports is null/undefined, it will be ignored
function getExports(fullpath, initializer, isCall, inject) {
  let exports = loadFile(fullpath);

  // process exports as you like
  if (initializer) {
    exports = initializer(exports, { path: fullpath });
  }

  // return exports when it's a class or generator
  //
  // module.exports = class Service {};
  // or
  // module.exports = function*() {}
  if (is.class(exports) || is.generatorFunction(exports)) {
    return exports;
  }

  // return exports after call when it's a function
  //
  // module.exports = function(app) {
  //   return {};
  // }
  if (isCall && is.function(exports)) {
    exports = exports(inject);
    if (exports != null) {
      return exports;
    }
  }

  // return exports what is
  return exports;
}
