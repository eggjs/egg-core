'use strict';

const block = require('./block');

module.exports = app => {
  block();

  app.beforeStart(function* () {
    block();
  })
};
