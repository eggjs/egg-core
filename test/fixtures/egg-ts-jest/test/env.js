require('ts-node').register();
// tell egg loader to load ts file
process.env.EGG_TYPESCRIPT = 'true';
// use type check
process.env.TS_NODE_TYPE_CHECK = process.env.TS_NODE_TYPE_CHECK || 'true';
// load files from tsconfig on startup
process.env.TS_NODE_FILES = process.env.TS_NODE_FILES || 'true';
const NodeEnvironment = require('jest-environment-node');
const EggApplication = require('../').Application;
const path = require('path');

const app = new EggApplication({
  baseDir: path.resolve(__dirname, '../'),
  type: 'application',
});
app.loader.loadAll();

module.exports = class CustomEnvironment extends NodeEnvironment {

  async setup() {
    await app.ready();
    await super.setup();
  }

  async teardown() {
    await super.teardown();
    await app.close();
  }

  runScript(script) {
    this.context.global.EggApp = app;
    return super.runScript(script);
  }
};
