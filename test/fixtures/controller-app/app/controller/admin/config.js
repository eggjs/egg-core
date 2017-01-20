'use strict';

module.exports = app => {
  return class AdminConfig extends app.Controller {
    * getName() {
      this.ctx.body = this.pathName;
    }
  };
};
