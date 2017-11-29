'use strict';

const crypto = require('crypto');

class Edge {
  constructor(from, to, optional) {
    this.from = from;
    this.to = to;
    this.optional = optional === true;
    this.id = sha1(`${from} ${to} ${this.optional}`);
  }
}

module.exports = Edge;

function sha1(str) {
  return crypto.createHash('sha1').update(str).digest('hex');
}
