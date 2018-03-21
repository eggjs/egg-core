import { Context } from 'egg';

export default () => {
  return async (ctx: Context, next) => {
    ctx.mid = 'from middleware';
    await next();
  }
}