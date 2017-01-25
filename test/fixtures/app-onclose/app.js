'use strict';

module.exports = app => {
  console.log(1111);
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
};
