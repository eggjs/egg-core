'use strict';

const assert = require('assert');
const is = require('is-type-of');
const FileLoader = require('./file_loader');
const EXPORTS = FileLoader.EXPORTS;

/**
 * Same as {@link FileLoader}, but it will attach file to `inject[fieldClass]`. The exports will be lazy loaded, such as `ctx.group.repository`.
 * @augments FileLoader
 * @since 1.0.0
 */
class ContextLoader extends FileLoader {
  /**
   * @class
   * @param {Object} options - options same as {@link FileLoader}
   * @param {String} options.fieldClass - determine the field name of inject object.
   */
  constructor(options) {
    assert(options.property, 'options.property is required');
    assert(options.inject, 'options.inject is required');

    // provide an empty target for FileLoader
    const target = (options.target = Object.create(null));
    super(options);

    const app = options.inject;
    if (options.fieldClass) {
      app[options.fieldClass] = target;
    }

    definePropertyGetter(app.context, options.property, target);
  }
}

module.exports = ContextLoader;

const CACHE = Symbol('ctx#instance');

function definePropertyGetter(obj, property, values, ctx) {
  return Object.defineProperty(obj, property, {
    get() {
      const cache = this[CACHE] || (this[CACHE] = new Map());

      let instance = cache.get(property);
      if (instance == null) {
        instance = getInstance(values, ctx || this);
        cache.set(property, instance);
      }

      return instance;
    },
  });
}

function getInstance(values, ctx) {
  if (values[EXPORTS]) {
    if (is.class(values)) {
      return new values(ctx);
    }
    // it's just an object
    return values;
  }

  // Can't set property to primitive
  // e.x. module.exports = 1;
  if (is.primitive(values)) {
    return values;
  }

  // it's a directory when it has no exports
  const namespace = Object.create(null);
  for (const property in values) {
    definePropertyGetter(namespace, property, values[property], ctx);
  }
  return namespace;
}
