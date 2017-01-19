'use strict';

module.exports = app => {
  app.get('/generator-function', 'generatorFunction');

  app.get('/object-function', 'object.callFunction');
  app.get('/object-generator-function', 'object.callGeneratorFunction');
  app.get('/object-generator-function-arg', 'object.callGeneratorFunctionWithArg');
  app.get('/object-async-function', 'object.callAsyncFunction');
  app.get('/object-async-function-arg', 'object.callAsyncFunctionWithArg');

  app.get('/class-function', 'class.callFunction');
  app.get('/class-generator-function', 'class.callGeneratorFunction');
  app.get('/class-generator-function-arg', 'class.callGeneratorFunctionWithArg');
  app.get('/class-async-function', 'class.callAsyncFunction');
  app.get('/class-async-function-arg', 'class.callAsyncFunctionWithArg');

  app.get('/class-wrap-function', 'classWrapFunction.get');

  app.resources('/resources-class', 'resourceClass');
  app.resources('/resources-object', 'resourceObject');
};
