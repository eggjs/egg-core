'use strict';

module.exports = app => {
  app.closeFn = false;
  app.closeGeneratorFn = false;
  app.closeAsyncFn = false;

  app.beforeClose(() => {
    app.closeFn = true;
  });
  app.beforeClose(function* () {
    app.closeGeneratorFn = true;
  });
  app.beforeClose(function() {
    return new Promise(resolve => {
      app.closeAsyncFn = true;
      resolve();
    });
  });

  let count = 0;
  function onlyOnce() {
    if (count === 0) {
      app.onlyOnce = false;
    } else {
      app.onlyOnce = true;
    }
    count++;
  }
  app.beforeClose(onlyOnce);
  app.beforeClose(onlyOnce);
};
