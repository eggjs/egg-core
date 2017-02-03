'use strict';

module.exports = app => {
  return class xxx extends app.BaseContextClass {
    * getPathname() {
      return this.pathName;
    }

    * getName() {
      return this.config.name;
    }
  };
};
