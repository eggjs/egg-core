'use strict';

module.exports = app => {
  const asyncMiddlewares = [];
  const generatorMiddlewares = [];
  const transferMiddlewares = [];

  for (let i = 0; i < 20; i++) {
    asyncMiddlewares.push(app.middlewares.async());
    generatorMiddlewares.push(app.middlewares.generator());
  }

  app.get('/async', ...asyncMiddlewares, 'home.async');
  app.get('/generator', ...generatorMiddlewares, 'home.generator');
}
