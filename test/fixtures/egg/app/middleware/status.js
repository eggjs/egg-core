'use strict';

module.exports = function() {
  return (ctx, next) => {
    ctx.traceId = `trace:${Date.now()}`;
    if (ctx.path === '/status') {
      ctx.body = 'egg status';
      return;
    }

    return next();
  };
};
