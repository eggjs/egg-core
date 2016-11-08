'use strict';

require('should');
const path = require('path');
const mm = require('mm');
const utils = require('../utils');

describe('test/loader/get_app_info.test.js', () => {

  let app;
  afterEach(() => app.close());
  afterEach(mm.restore);

  it('should get appInfo', () => {
    app = utils.createApp('appinfo');
    app.loader.appInfo.name.should.eql('appinfo');
    app.loader.appInfo.baseDir.should.eql(path.join(__dirname, '../fixtures/appinfo'));
    app.loader.appInfo.env.should.eql('unittest');
    app.loader.appInfo.HOME.should.eql(process.env.HOME);
    app.loader.appInfo.pkg.should.eql({
      name: 'appinfo',
    });
  });

  it('should get root when unittest', () => {
    mm(process.env, 'EGG_SERVER_ENV', 'unittest');
    app = utils.createApp('appinfo');
    app.loader.appInfo.root.should.eql(path.join(__dirname, '../fixtures/appinfo'));
  });

  it('should get root when unittest', () => {
    mm(process.env, 'EGG_SERVER_ENV', 'local');
    app = utils.createApp('appinfo');
    app.loader.appInfo.root.should.eql(path.join(__dirname, '../fixtures/appinfo'));
  });

  it('should get root when unittest', () => {
    mm(process.env, 'EGG_SERVER_ENV', 'default');
    app = utils.createApp('appinfo');
    app.loader.appInfo.root.should.eql(process.env.HOME);
  });
});
