'use strict';

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
module.exports = class HomeController {

  constructor(ctx) {
    this.ctx = ctx;
  }

  callFunction() {
    this.ctx.body = 'done';
  }

  * callGeneratorFunction() {
    this.ctx.body = yield this.ctx.service.home.info();
  }

  * callGeneratorFunctionWithArg(ctx) {
    ctx.body = yield ctx.service.home.info();
  }

  callAsyncFunction() {
    return __awaiter(this, void 0, void 0, function* () {
      this.ctx.body = yield this.ctx.service.home.info();
    });
  }

  callAsyncFunctionWithArg(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
      ctx.body = yield ctx.service.home.info();
    });
  }

  // won't be loaded
  get nofunction() {
    return 'done';
  }
};
