'use strict';

const should = require('should');
const mm = require('mm');
const util = require('util');
const utils = require('./utils');
const EggCore = require('..').EggCore;
const EggLoader = require('..').EggLoader;

describe('test/egg.test.js', () => {
  afterEach(mm.restore);

  describe('create EggCore', () => {

    class Application extends EggCore {
      get [Symbol.for('egg#loader')]() {
        return EggLoader;
      }
      get [Symbol.for('egg#eggPath')]() {
        return utils.getFilepath('egg');
      }
    }

    let app;
    after(() => app && app.close());

    it('should use cwd when no options', () => {
      app = new Application();
      app._options.baseDir.should.equal(process.cwd());
    });

    it('should set default application when no type', () => {
      app = new Application();
      app.type.should.equal('application');
    });

    it('should not set value expect for application and agent', () => {
      (function() {
        new Application({
          type: 'nothing',
        });
      }).should.throw('options.type should be application or agent');
    });

    it('should throw options.baseDir required', () => {
      (function() {
        new Application({
          baseDir: 1,
        });
      }).should.throw('options.baseDir required, and must be a string');
    });

    it('should throw options.baseDir not exist', () => {
      (function() {
        new Application({
          baseDir: 'not-exist',
        });
      }).should.throw('Directory not-exist not exists');
    });

    it('should throw options.baseDir is not a directory', () => {
      (function() {
        new Application({
          baseDir: __filename,
        });
      }).should.throw(`Directory ${__filename} is not a directory`);
    });
  });

  describe('getters', () => {
    let app;
    before(() => {
      app = utils.createApp('app-getter');
      app.loader.loadPlugin();
      app.loader.loadConfig();
      return app.ready();
    });
    after(() => app.close());

    it('should has get type', () => {
      app.type.should.equal('application');
    });

    it('should has baseDir', () => {
      app.baseDir.should.equal(utils.getFilepath('app-getter'));
    });

    it('should has name', () => {
      app.name.should.equal('app-getter');
    });

    it('should has plugins', () => {
      should.exists(app.plugins);
      app.plugins.should.equal(app.loader.plugins);
    });

    it('should has config', () => {
      should.exists(app.config);
      app.config.should.equal(app.loader.config);
    });
  });

  describe('app.deprecate()', () => {
    let app;
    afterEach(() => app && app.close());

    it('should deprecate with namespace egg', () => {
      app = utils.createApp('plugin');
      const deprecate = app.deprecate;
      deprecate._namespace.should.equal('egg');
      deprecate.should.equal(app.deprecate);
    });
  });

  describe('app.readyCallback()', () => {
    let app;
    afterEach(() => app.close());

    it('should log info when plugin is not ready', done => {
      app = utils.createApp('notready');
      app.loader.loadAll();
      mm(app.console, 'warn', (message, a) => {
        message.should.equal('[egg:core:ready_timeout] 10 seconds later %s was still unable to finish.');
        a.should.equal('a');
        done();
      });
      app.ready(() => {
        throw new Error('should not be called');
      });
    });

    it('should log info when plugin is not ready', done => {
      app = utils.createApp('ready');
      app.loader.loadAll();
      let message = '';
      mm(app.console, 'info', (a, b, c) => {
        message += util.format.apply(null, [ a, b, c ]);
      });
      app.ready(() => {
        message.should.containEql('[egg:core:ready_stat] end ready task a, remain ["b"]');
        message.should.containEql('[egg:core:ready_stat] end ready task b, remain []');
        done();
      });
    });
  });

  describe('app.close()', () => {
    let app;
    afterEach(() => app.close());

    it('should emit close event before exit', () => {
      app = utils.createApp('close');
      let called = false;
      app.on('close', () => {
        called = true;
      });
      app.close();
      called.should.equal(true);
    });
  });
});
