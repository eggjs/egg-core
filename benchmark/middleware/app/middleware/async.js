'use strict';

let index = 0;

module.exports = function () {
  return async (ctx, next) => {
    await next();
    ctx.body.push(`async middleware #${++index}`);
  };
};
