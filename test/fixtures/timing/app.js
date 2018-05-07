'use strict';

const path = require('path');
const block = require('./block');

module.exports = app => {
  block();

  app.beforeStart(function* () {
    block();
  })

  const directory = path.join(app.baseDir, 'app/proxy');
  app.loader.loadToContext(directory, 'proxy');
};
