'use strict';

const path = require('path');

exports.bootPlugin = {
  enable: true,
  path: path.join(__dirname, '../app/plugin/boot-plugin'),
};
