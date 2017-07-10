'use strict';

const Node = require('./node');

class NodeNetwork {

  // json is node map
  constructor(json) {
    this.map = new Map();
    this.order = [];
    for (const name of Object.keys(json)) {
      if (this.map.has(name)) continue;

      const nodeJSON = json[name];
      const node = this.setNode(name, nodeJSON);

      if (Array.isArray(nodeJSON.dependencies)) {
        for (const name of nodeJSON.dependencies) {
          const dep = this.setNode(name, json[name]);
          node.addDependency(dep);
        }
      }

      if (Array.isArray(nodeJSON.optionalDependencies)) {
        for (const name of nodeJSON.optionalDependencies) {
          const dep = this.setNode(name, json[name]);
          node.addOptionalDependencies(dep);
        }
      }
    }
  }

  setNode(name, nodeJSON) {
    if (this.map.has(name)) return this.map.get(name);
    const node = new Node(nodeJSON);
    this.map.set(name, node);
    return node;
  }

  enable(name) {
    const node = this.map.get(name);
    node.enable = true;
  }

  disable(name) {
    const node = this.map.get(name);
    node.enable = false;
  }
}

module.exports = NodeNetwork;
