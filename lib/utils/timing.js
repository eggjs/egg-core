'use strict';

class Timing {

  constructor() {
    this.items = new Map();
  }

  start(name) {
    if (!(name && !this.items.has(name))) return;

    const start = Date.now();
    const item = {
      name,
      start,
      end: start,
      pid: process.pid,
    };
    this.items.set(name, item);
    return item;
  }

  end(name) {
    if (!(name && this.items.has(name))) return;

    const item = this.items.get(name);
    item.end = Date.now();
    item.duration = item.end - item.start;
    return item;
  }

  toJSON() {
    return [ ...this.items.values() ];
  }
}

module.exports = Timing;
