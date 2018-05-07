'use strict';

const assert = require('assert');
const ITEMS = Symbol('Timing#items');


class Timing {

  constructor() {
    this[ITEMS] = new Map();
  }

  start(name) {
    if (!name) return;
    assert(!this[ITEMS].has(name), `${name} has been registered`);

    const start = Date.now();
    const item = {
      name,
      start,
      end: undefined,
      duration: undefined,
      pid: process.pid,
    };
    this[ITEMS].set(name, item);
    return item;
  }

  end(name) {
    if (!name) return;
    assert(this[ITEMS].has(name), `should run timing.start('${name}') first`);

    const item = this[ITEMS].get(name);
    item.end = Date.now();
    item.duration = item.end - item.start;
    return item;
  }

  toJSON() {
    return [ ...this[ITEMS].values() ];
  }
}

module.exports = Timing;
