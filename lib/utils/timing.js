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
    return [ ...this.items.values() ]
      .map(item => ([ item.name, item.start, item.end ]));
  }
}

module.exports = new Timing();
