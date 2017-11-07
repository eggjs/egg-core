'use strict';

module.exports = function() {
  return (ctx, next) => {
    if (ctx.path === '/status') {
      ctx.body = 'egg status';
      return;
    }

    return next();
  };
};
