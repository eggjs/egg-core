'use strict';

const urllib = require('urllib');

exports.urllib = {
  keepAlive: false,
  foo: null,
  bar: undefined,
  n: 1,
};

exports.buffer = new Buffer('1234');
exports.array = [];

exports.console = console;

exports.zero = 0;
exports.number = 1;
exports.ok = true;
exports.f = false;
exports.no = null;
exports.empty = {};
