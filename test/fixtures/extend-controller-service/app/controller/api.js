'use strict';

module.exports = app => {
  return class ApiController extends app.Controller {
    * successAction() {
      const res = yield this.service.api.get();
      this.success({ foo: res });
    }

    * failAction() {
      this.fail('something wrong');
    }
  };
};
