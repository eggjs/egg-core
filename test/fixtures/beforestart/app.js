'use strict';

module.exports = function(app) {
  app.beforeStart(function*() {
    if (!app.isReady) throw new Error('not ready');
  });

  app.isReady = true;
};
