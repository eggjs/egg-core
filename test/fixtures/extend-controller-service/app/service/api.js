'use strict';

module.exports = app => {
  return class ApiService extends app.Service {
    * get() {
      return yield this.getData();
    }
  };
};
