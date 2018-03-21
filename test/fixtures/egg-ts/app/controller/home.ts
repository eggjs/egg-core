import { Controller } from 'egg';

export default class HomeController extends Controller {
  public async index() {
    const { ctx, app } = this;
    const serviceText = ctx.service.test.getTest();
    const helper = new ctx.app.Helper();

    ctx.body = [
      ctx.contextShow(),
      ctx.app.applicationShow(),
      ctx.request.requestShow(),
      ctx.response.responseShow(),
      ctx.app.agentShow(),
      helper.helperShow(),
      app.fromCustomApp,
      app.fromCustomAgent,
      app.config.test,
      app.config.testFromA,
      ctx.mid,
      serviceText
    ].join(',');
  }
}
