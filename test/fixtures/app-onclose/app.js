'use strict';

module.exports = app => {
  app.closeFn = false;
  app.closeGeneratorFn = false;
  app.closeAsyncFn = false;

  app.onClose(() => {
    app.closeFn = true;
  });
  app.onClose(function* () {
    app.closeGeneratorFn = true;
  });
  app.onClose(function() {
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
  app.onClose(onlyOnce);
  app.onClose(onlyOnce);
};
