'use strict';

const path = require('path');
const mm = require('mm');
const assert = require('assert');
const utils = require('../utils');

describe('test/loader/get_app_info.test.js', () => {

  let app;
  afterEach(() => app.close());
  afterEach(mm.restore);

  it('should get appInfo', () => {
    app = utils.createApp('appinfo');
    assert(app.loader.appInfo.name === 'appinfo');
    assert(app.loader.appInfo.baseDir === path.join(__dirname, '../fixtures/appinfo'));
    assert(app.loader.appInfo.env === 'unittest');
    assert(app.loader.appInfo.HOME === process.env.HOME);
    assert.deepEqual(app.loader.appInfo.pkg, {
      name: 'appinfo',
    });
  });

  it('should get root when unittest', () => {
    mm(process.env, 'EGG_SERVER_ENV', 'unittest');
    app = utils.createApp('appinfo');
    assert(app.loader.appInfo.root === path.join(__dirname, '../fixtures/appinfo'));
  });

  it('should get root when unittest', () => {
    mm(process.env, 'EGG_SERVER_ENV', 'local');
    app = utils.createApp('appinfo');
    assert(app.loader.appInfo.root === path.join(__dirname, '../fixtures/appinfo'));
  });

  it('should get root when unittest', () => {
    mm(process.env, 'EGG_SERVER_ENV', 'default');
    app = utils.createApp('appinfo');
    assert(app.loader.appInfo.root === process.env.HOME);
  });
});
