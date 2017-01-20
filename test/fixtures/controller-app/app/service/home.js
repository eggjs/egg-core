'use strict';

module.exports = app => {
  return class HomeService extends app.Service {
    info() {
      return new Promise(resolve => {
        resolve('done');
      })
    }
  };
};
