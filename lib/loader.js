'use strict';

const assert = require('assert');
const fs = require('fs');
const debug = require('debug')('egg-loader:loader');
const path = require('path');
const globby = require('globby');
const is = require('is-type-of');
const loadFile = require('./utils').loadFile;
const FULLPATH = Symbol('EGG_LOADER_ITEM_FULLPATH');

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

class Loader {

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
      item.properties.reduce((target, property, index) => {
        let obj;
        const properties = item.properties.slice(0, index + 1).join('.');
        if (index === item.properties.length - 1) {
          if (property in target) {
            if (!this.options.override) throw new Error(`can't overwrite property '${properties}' from ${target[property][FULLPATH]} by ${item.fullpath}`);
          }
          obj = item.exports;
          if (obj) obj[FULLPATH] = item.fullpath;
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

module.exports = Loader;

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

function getExports(fullpath, initializer, isCall, inject) {
  let exports = loadFile(fullpath);

  if (initializer) {
    exports = initializer(exports);
  }

  if (is.class(exports) || is.generatorFunction(exports)) {
    return exports;
  }

  if (isCall && is.function(exports)) {
    exports = exports(inject);
    if (exports != null) {
      return exports;
    }
  }

  return exports;
}
