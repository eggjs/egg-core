'use strict';

exports.index = function* () {
  this.body = 'index';
};

exports.create = async ctx => {
  ctx.body = 'create';
};
