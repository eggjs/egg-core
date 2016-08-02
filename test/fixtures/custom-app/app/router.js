'use strict';

module.exports = function(app) {
  app.get('/', function*() {
    this.body = {
      customFoo: app.customFoo,
      env: app.config.env,
      eggPaths: app.loader.eggPaths,
      eggPaths: app.loader.eggPaths,
      eggPath: app.loader.eggPath,
    };
  });
};
