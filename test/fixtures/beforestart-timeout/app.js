'use strict';

module.exports = function(app) {
  app.beforeStart(function*() {
    yield sleep(11000);
  });
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
