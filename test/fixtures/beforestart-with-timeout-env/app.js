'use strict';

const sleep = require('ko-sleep');
module.exports = function (app) {
  app.beforeStart(function* () {
    yield sleep(11000);
    app.beforeStartFunction = true;
  });
  app.beforeStartFunction = false;
};

