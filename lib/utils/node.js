'use strict';

const assert = require('assert');

class Node {
  constructor(name, opt) {
    assert(name, 'name is required when create node');
    opt = this.opt = opt || {};
    this.name = name;
    this.enable = opt.enable !== false;
    this.dependencies = [];
    this.optionalDependencies = [];
  }

  addDependency(node) {
    assert(node instanceof Node, 'Node is required, but got ' + node);
    if (!this.dependencies.includes(node)) {
      this.dependencies.push(node);
    }
  }

  addOptionalDependency(node) {
    assert(node instanceof Node, 'Node is required, but got ' + node);
    if (!this.optionalDependencies.includes(node)) {
      this.optionalDependencies.push(node);
    }
  }
}

module.exports = Node;
