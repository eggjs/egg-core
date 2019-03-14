import { BaseContextClass, EggCore } from '../../..';

// normal
const app = new EggCore<{ env: string }>();
console.info(app.abb);
console.info(app.Controller.abc);
console.info(app.Service.bbc);
app.loader.loadPlugin();
app.loader.loadConfig();
app.loader.loadApplicationExtend();
app.loader.loadAgentExtend();
app.loader.loadRequestExtend();
app.loader.loadResponseExtend();
app.loader.loadContextExtend();
app.loader.loadHelperExtend();
app.loader.loadCustomAgent();
app.loader.loadService();
app.loader.loadController();
app.loader.loadRouter();
app.loader.loadMiddleware();
new BaseContextClass({ app: {} }).ctx;
