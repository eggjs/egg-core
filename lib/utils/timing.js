'use strict';

const { EOL } = require('os');
const assert = require('assert');

const MAP = Symbol('Timing#map');
const LIST = Symbol('Timing#list');

class Timing {
  constructor() {
    this._enable = true;
    this._start = null;
    this[MAP] = new Map();
    this[LIST] = [];

    this.init();
  }

  init() {
    // process start time
    this.start('Process Start', Date.now() - Math.floor(process.uptime() * 1000));
    this.end('Process Start');

    if (typeof process.scriptStartTime === 'number') {
      // js script start execute time
      this.start('Script Start', process.scriptStartTime);
      this.end('Script Start');
    }
  }

  start(name, start) {
    if (!name || !this._enable) return;

    if (this[MAP].has(name)) this.end(name);

    start = start || Date.now();
    if (this._start === null) {
      this._start = start;
    }
    const item = {
      name,
      start,
      end: undefined,
      duration: undefined,
      pid: process.pid,
      index: this[LIST].length,
    };
    this[MAP].set(name, item);
    this[LIST].push(item);
    return item;
  }

  end(name) {
    if (!name || !this._enable) return;
    assert(this[MAP].has(name), `should run timing.start('${name}') first`);

    const item = this[MAP].get(name);
    item.end = Date.now();
    item.duration = item.end - item.start;
    return item;
  }

  enable() {
    this._enable = true;
  }

  disable() {
    this._enable = false;
  }

  clear() {
    this[MAP].clear();
    this[LIST] = [];
  }

  toJSON() {
    return this[LIST];
  }

  itemToString(timelineEnd, item, times) {
    const isEnd = typeof item.duration === 'number';
    const duration = isEnd ? item.duration : timelineEnd - item.start;
    const offset = item.start - this._start;
    const status = `${duration}ms${isEnd ? '' : ' NOT_END'}`;
    const timespan = Math.floor((offset * times).toFixed(6));
    let timeline = Math.floor((duration * times).toFixed(6));
    timeline = timeline > 0 ? timeline : 1; // make sure there is at least one unit
    const message = `#${item.index} ${item.name}`;
    return ' '.repeat(timespan) + '▇'.repeat(timeline) + ` [${status}] - ${message}`;
  }

  toString(prefix = 'egg start timeline:', width = 50) {
    const timelineEnd = Date.now();
    const timelineDuration = timelineEnd - this._start;
    let times = 1;
    if (timelineDuration > width) {
      times = width / timelineDuration;
    }
    // follow https://github.com/node-modules/time-profile/blob/master/lib/profiler.js#L88
    return prefix + EOL + this[LIST].map(item => this.itemToString(timelineEnd, item, times)).join(EOL);
  }
}

module.exports = Timing;
