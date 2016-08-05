'use strict';

const assert = require('assert');
const is = require('is-type-of');
const Loader = require('./loader');
const classLoader = Symbol('classLoader');
const EXPORTS = Loader.EXPORTS;

class ClassLoader {

  constructor(options) {
    assert(options.ctx, 'options.ctx is required');
    const properties = options.properties;
    this._cache = new Map();
    this._ctx = options.ctx;

    for (const property in properties) {
      this.defineProperty(property, properties[property]);
    }
  }

  defineProperty(property, values) {
    Object.defineProperty(this, property, {
      get() {
        if (!this._cache.has(property)) {
          this._cache.set(property, getInstance(values, this._ctx));
        }
        return this._cache.get(property);
      },
    });
  }
}

class ContextLoader extends Loader {

  constructor(options) {
    assert(options.field, 'options.field is required');
    assert(options.inject, 'options.inject is required');
    const target = options.target = {};
    if (options.fieldClass) {
      options.inject[options.fieldClass] = target;
    }
    super(options);

    const app = this.options.inject;

    Object.defineProperty(app.context, options.field, {
      get() {
        if (!this[classLoader]) {
          this[classLoader] = getInstance(target, this);
        }
        return this[classLoader];
      },
    });
  }
}

module.exports = ContextLoader;


function getInstance(values, ctx) {
  const Class = values[EXPORTS] ? values : null;
  let instance;
  if (Class) {
    if (is.class(Class)) {
      instance = new Class(ctx);
    } else {
      instance = Class;
    }
  } else {
    instance = new ClassLoader({ ctx, properties: values });
  }
  return instance;
}
