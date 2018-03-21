import { Controller } from 'egg';

export default class HomeController extends Controller {
  public async index() {
    const { ctx, app } = this;
    const serviceText = ctx.service.test.getTest();

    ctx.body = [
      ctx.contextShow(),
      ctx.app.applicationShow(),
      ctx.request.requestShow(),
      ctx.response.responseShow(),
      app.fromCustomApp,
      app.fromCustomAgent,
      app.config.test,
      app.config.testFromA,
      ctx.mid,
      serviceText
    ].join(',');
  }
}
