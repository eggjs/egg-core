'use strict';

const assert = require('assert');
const Timing = require('../../lib/utils/timing');

describe('test/utils/timing.test.js', () => {

  it('should trace', () => {
    const timing = new Timing();
    timing.start('a');
    timing.end('a');
    timing.start('b');
    timing.end('b');

    const json = timing.toJSON();
    assert(json.length === 2);

    assert(json[0].name === 'a');
    assert(json[0].end - json[0].start === json[0].duration);
    assert(json[0].pid === process.pid);
    assert(json[1].name === 'b');
    assert(json[1].end - json[1].start === json[1].duration);
    assert(json[1].pid === process.pid);
  });

  it('should set item when start', () => {
    const timing = new Timing();
    timing.start('a');

    const json = timing.toJSON();
    assert(json[0].name === 'a');
    assert(json[0].end === json[0].start);
    assert(json[0].duration === undefined);
  });

  it('should not set item when name is empty', () => {
    const timing = new Timing();
    timing.start();

    const json = timing.toJSON();
    assert(json.length === 0);
  });

  it('should not set item when the item of name exists', () => {
    const timing = new Timing();
    timing.start('a');
    const json = timing.toJSON();
    assert(json[0].name === 'a');
    const start = json[0].start;

    timing.start('a');
    assert(timing.toJSON()[0].start === start);
  });

  it('should ignore end when name dont exist', () => {
    const timing = new Timing();
    timing.end();
    assert(timing.toJSON().length === 0);

    timing.end('a');
    assert(timing.toJSON().length === 0);
  });
});
