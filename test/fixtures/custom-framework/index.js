'use strict';

module.exports = require('../../../');
const startCluster = module.exports.startCluster;

module.exports.startCluster = function(options) {
  options.customEgg = __dirname;
  return startCluster(options);
};
