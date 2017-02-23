'use strict';

exports.get = function* () {
  this.body = this.params[0];
};
