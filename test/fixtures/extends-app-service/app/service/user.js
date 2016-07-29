'use strict';

module.exports = function (app) {
  class User extends app.Service {
    constructor(ctx) {
      super(ctx);
    }

    * get(uid) {
      return '123mock';
    }
  }

  return User;
};
