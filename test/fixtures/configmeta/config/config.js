'use strict';

const HttpClient2 = require('urllib').HttpClient2;
const urllib = new HttpClient2();

exports.urllib = {
  keepAlive: false,
  foo: null,
  bar: undefined,
  n: 1,
  dd: new Date(),
  httpclient: urllib,
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
exports.date = new Date();
exports.ooooo = urllib;
