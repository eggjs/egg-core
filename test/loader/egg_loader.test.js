'use strict';

const assert = require('assert');
const os = require('os');
const mm = require('mm');
const path = require('path');
const utils = require('../utils');
const EggLoader = require('../../lib/loader/egg_loader');
const getPlugins = require('egg-utils').getPlugins;


describe('test/loader/egg_loader.test.js', () => {
  let app;
  before(() => {
    app = utils.createApp('nothing');
  });

  it('should container FileLoader and ContextLoader', () => {
    assert(app.loader.FileLoader);
    assert(app.loader.ContextLoader);
  });

  describe('loader.getHomedir()', () => {
    afterEach(mm.restore);

    it('should return process.env.HOME', () => {
      if (os.userInfo && os.userInfo().homedir) {
        const userInfo = os.userInfo();
        delete userInfo.homedir;
        mm(os, 'userInfo', () => userInfo);
      }
      assert(app.loader.getHomedir() === process.env.HOME);
    });

    it('should return /home/admin when process.env.HOME is not exist', () => {
      mm(process.env, 'HOME', '');
      mm(os, 'userInfo', null);
      mm(os, 'homedir', null);
      assert(app.loader.getHomedir() === '/home/admin');
    });

    it('should return when EGG_HOME exists', () => {
      mm(process.env, 'EGG_HOME', '/path/to/home');
      assert(app.loader.getHomedir() === '/path/to/home');
    });
  });

  describe('new Loader()', () => {
    it('should pass', () => {
      const loader = new EggLoader({
        baseDir: path.join(__dirname, '../fixtures/nothing'),
        app: {},
        logger: console,
      });
      loader.loadPlugin();
    });

    it('should get plugin with egg-utils', () => {
      getPlugins({
        baseDir: path.join(__dirname, '../fixtures/nothing'),
        framework: path.join(__dirname, '../fixtures/egg'),
      });
    });

    it('should loadFile auto resolve file', () => {
      const loader = new EggLoader({
        baseDir: path.join(__dirname, '../fixtures/nothing'),
        app: {},
        logger: console,
      });

      let ret = loader.loadFile(path.join(__dirname, '../fixtures/load_file/function.js'), 1, 2);
      assert(ret[0] === 1);
      assert(ret[1] === 2);

      ret = loader.loadFile(path.join(__dirname, '../fixtures/load_file/function'), 1, 2);
      assert(ret[0] === 1);
      assert(ret[1] === 2);
    });
  });

  it('should be loaded by loadToApp', () => {
    const baseDir = path.join(__dirname, '../fixtures/load_to_app');
    const directory = path.join(baseDir, 'app/model');
    const prop = Symbol();
    const app = {};
    const loader = new EggLoader({
      baseDir,
      app,
      logger: console,
    });
    loader.loadToApp(directory, prop);
    assert(app[prop].user);
  });

  it('should be loaded by loadToContext', () => {
    const baseDir = path.join(__dirname, '../fixtures/load_to_app');
    const directory = path.join(baseDir, 'app/service');
    const prop = Symbol();
    const app = { context: {} };
    const loader = new EggLoader({
      baseDir,
      app,
      logger: console,
    });
    loader.loadToContext(directory, prop);
    assert(app.context[prop].user);
  });
});
