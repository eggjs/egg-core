'use strict';

module.exports = function(app) {
  app.get('/', function*() {
    this.body = {
      customFoo: app.customFoo,
      env: app.config.env,
      eggPaths: app.loader.eggPaths,
      frameworkPaths: app.loader.frameworkPaths,
      eggPath: app.loader.eggPath,
    };
  });
};
