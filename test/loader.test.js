'use strict';

/**
 * Module dependencies.
 */

const should = require('should');
const pedding = require('pedding');
const path = require('path');
const Loader = require('../lib/loader');
const dirBase = path.join(__dirname, 'fixtures/load_dirs');

describe('test/loader.test.js', () => {

  it('should load files', done => {
    const services = {};
    new Loader({
      directory: path.join(dirBase, 'services'),
      target: services,
    }).load();

    services.should.have.keys('dir', 'foo', 'fooBarHello', 'fooService', 'hyphenDir', 'underscoreDir', 'userProfile');
    should.exists(services.dir.abc);
    should.exists(services.dir.service);
    should.exists(services.foo);
    should.exists(services.fooBarHello);
    should.exists(services.fooService);
    should.exists(services.hyphenDir.a);
    should.exists(services.underscoreDir.a);
    should.exists(services.userProfile);

    done = pedding(2, done);
    services.foo.get((err, v) => {
      should.not.exist(err);
      v.should.equal('bar');
      done();
    });
    services.userProfile.getByName('mk2', (err, user) => {
      should.not.exist(err);
      user.should.eql({ name: 'mk2' });
      done();
    });

    services.dir.service.should.have.keys('load', 'app');
    services.dir.service.load.should.equal(true);
  });

  it('should not overwrite property', () => {
    const app = {
      services: {
        foo: {},
      },
    };
    (function() {
      new Loader({
        directory: path.join(dirBase, 'services'),
        target: app.services,
      }).load();
    }).should.throw(/^can't overwrite property 'foo'/);
  });

  it('should not overwrite property from loading', () => {
    const app = { services: {} };
    (function() {
      new Loader({
        directory: [
          path.join(dirBase, 'services'),
          path.join(dirBase, 'overwrite_services'),
        ],
        target: app.services,
      }).load();
    }).should.throw(/^can't overwrite property 'foo'/);
  });

  it('should overwrite property from loading', () => {
    const app = { services: {} };
    new Loader({
      directory: [
        path.join(dirBase, 'services'),
        path.join(dirBase, 'overwrite_services'),
      ],
      override: true,
      target: app.services,
    }).load();
  });

  it('should loading without call function', () => {
    const app = { services: {} };
    new Loader({
      directory: path.join(dirBase, 'services'),
      target: app.services,
      call: false,
    }).load();
    app.services.fooService().should.eql({ a: 1 });
  });

  it('should loading without call es6 class', () => {
    const app = { services: {} };
    new Loader({
      directory: path.join(dirBase, 'class'),
      target: app.services,
    }).load();
    (function() {
      app.services.UserProxy();
    }).should.throw(/cannot be invoked without 'new'/);
    const instance = new app.services.UserProxy();
    instance.getUser().should.eql({ name: 'xiaochen.gaoxc' });
  });

  it('should loading without call babel class', () => {
    const app = { services: {} };
    new Loader({
      directory: path.join(dirBase, 'babel'),
      target: app.services,
    }).load();
    const instance = new app.services.UserProxy();
    instance.getUser().should.eql({ name: 'xiaochen.gaoxc' });
  });

  it.skip('should only load property match the filers', () => {
    const app = { middlewares: {} };
    new Loader({
      directory: [
        path.join(dirBase, 'middlewares/default'),
        path.join(dirBase, 'middlewares/app'),
      ],
      target: app.middlewares,
      call: false,
      filters: [ 'm1', 'm2', 'dm1', 'dm2' ],
    }).load();
    app.middlewares.should.have.keys('m1', 'm2', 'dm1', 'dm2');
  });

  it('should support ignore', () => {
    const app = { services: {} };
    new Loader({
      directory: path.join(dirBase, 'ignore'),
      target: app.services,
      ignore: 'util/**',
    }).load();
    app.services.should.have.property('a', { a: 1 });
  });

  it('should support lowercase first letter', () => {
    const app = { services: {} };
    new Loader({
      directory: path.join(dirBase, 'lowercase'),
      target: app.services,
      lowercaseFirst: true,
    }).load();
    app.services.should.have.properties('someClass', 'someDir');
    app.services.someDir.should.have.property('someSubClass');
  });

  it('should support options.initializer with es6 class ', () => {
    const app = { dao: {} };
    new Loader({
      directory: path.join(dirBase, 'dao'),
      target: app.dao,
      ignore: 'util/**',
      initializer(exports) {
        return new exports(app);
      },
    }).load();
    app.dao.should.have.property('TestClass');
    app.dao.TestClass.user.should.eql({ name: 'kai.fangk' });
    app.dao.should.have.property('testFunction', { user: { name: 'kai.fangk' } });
    app.dao.should.have.property('testReturnFunction', { user: { name: 'kai.fangk' } });
  });

  it('should pass es6 module', () => {
    const app = { model: {} };
    new Loader({
      directory: path.join(dirBase, 'es6_module'),
      target: app.model,
    }).load();
    app.model.mod.should.eql({ a: 1 });
  });

  it('should contain syntax error filepath', () => {
    const app = { model: {} };
    (function() {
      new Loader({
        directory: path.join(dirBase, 'syntax_error'),
        target: app.model,
      }).load();
    }).should.throw(/load file: .*?test\/fixtures\/load_dirs\/syntax_error\/error\.js, error:/);
  });

  it('should throw when directory contains dot', () => {
    const mod = {};
    (function() {
      new Loader({
        directory: path.join(dirBase, 'error/dotdir'),
        target: mod,
      }).load();
    }).should.throw('dot.dir is not match \'a-z0-9_-\' in dot.dir/a.js');
  });

  it('should throw when directory contains dot', () => {
    const mod = {};
    (function() {
      new Loader({
        directory: path.join(dirBase, 'error/underscore-dir'),
        target: mod,
      }).load();
    }).should.throw('_underscore is not match \'a-z0-9_-\' in _underscore/a.js');
    (function() {
      new Loader({
        directory: path.join(dirBase, 'error/underscore-file-in-dir'),
        target: mod,
      }).load();
    }).should.throw('_a is not match \'a-z0-9_-\' in dir/_a.js');
  });

  it('should throw when file starts with underscore', () => {
    const mod = {};
    (function() {
      new Loader({
        directory: path.join(dirBase, 'error/underscore-file'),
        target: mod,
      }).load();
    }).should.throw('_private is not match \'a-z0-9_-\' in _private.js');
  });
});
