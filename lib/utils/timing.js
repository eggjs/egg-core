'use strict';

const ITEMS = Symbol('Timing@items');

class Timing {

  constructor() {
    this[ITEMS] = new Map();
  }

  start(name) {
    if (!(name && !this[ITEMS].has(name))) return;

    const start = Date.now();
    const item = {
      name,
      start,
      end: start,
      pid: process.pid,
    };
    this[ITEMS].set(name, item);
    return item;
  }

  end(name) {
    if (!(name && this[ITEMS].has(name))) return;

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
