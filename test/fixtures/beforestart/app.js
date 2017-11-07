'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
    function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
    function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
    step((generator = generator.apply(thisArg, _arguments)).next());
  });
};
const sleep = require('ko-sleep');
module.exports = function (app) {
  app.beforeStart(function() {
    app.beforeStartFunction = true;
  });
  app.beforeStart(function* () {
    yield sleep(1000);
    app.beforeStartGeneratorFunction = true;
  });
  app.beforeStart(function () {
    return __awaiter(this, void 0, void 0, function* () {
      yield sleep(1000);
      app.beforeStartTranslateAsyncFunction = true;
    });
  });
  app.beforeStart(async () => {
    await sleep(1000);
    app.beforeStartAsyncFunction = true;
  });
  app.beforeStartFunction = false;
  app.beforeStartTranslateAsyncFunction = false;
  app.beforeStartGeneratorFunction = false;
  app.beforeStartAsyncFunction = false;
};
