'use strict';

const assert = require('assert');
const pedding = require('pedding');
const path = require('path');
const is = require('is-type-of');
const FileLoader = require('../../lib/loader/file_loader');
const dirBase = path.join(__dirname, '../fixtures/load_dirs');

describe('test/file_loader.test.js', () => {

  it('should load files', done => {
    const services = {};
    new FileLoader({
      directory: path.join(dirBase, 'services'),
      target: services,
    }).load();

    assert(services.dir.abc);
    assert(services.dir.service);
    assert(services.foo);
    assert(services.fooBarHello);
    assert(services.fooService);
    assert(services.hyphenDir.a);
    assert(services.underscoreDir.a);
    assert(services.userProfile);

    done = pedding(2, done);
    services.foo.get((err, v) => {
      assert.ifError(err);
      assert(v === 'bar');
      done();
    });
    services.userProfile.getByName('mk2', (err, user) => {
      assert.ifError(err);
      assert.deepEqual(user, { name: 'mk2' });
      done();
    });

    assert('load' in services.dir.service);
    assert('app' in services.dir.service);
    assert(services.dir.service.load === true);
  });

  it('should not overwrite property', () => {
    const app = {
      services: {
        foo: {},
      },
    };
    assert.throws(
      () => {
        new FileLoader({
          directory: path.join(dirBase, 'services'),
          target: app.services,
        }).load();
      },
      /can't overwrite property 'foo'/
    );
  });

  it('should not overwrite property from loading', () => {
    const app = { services: {} };
    assert.throws(() => {
      new FileLoader({
        directory: [
          path.join(dirBase, 'services'),
          path.join(dirBase, 'overwrite_services'),
        ],
        target: app.services,
        logger: console,
      }).load();
    }, /can't overwrite property 'foo'/);
  });

  it('should overwrite property from loading', () => {
    const app = { services: {} };
    new FileLoader({
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
    new FileLoader({
      directory: path.join(dirBase, 'services'),
      target: app.services,
      call: false,
    }).load();
    assert.deepEqual(app.services.fooService(), { a: 1 });
  });

  it('should loading without call es6 class', () => {
    const app = { services: {} };
    new FileLoader({
      directory: path.join(dirBase, 'class'),
      target: app.services,
    }).load();
    assert.throws(() => {
      app.services.UserProxy();
    }, /cannot be invoked without 'new'/);
    const instance = new app.services.UserProxy();
    assert.deepEqual(instance.getUser(), { name: 'xiaochen.gaoxc' });
  });

  it('should loading without call babel class', () => {
    const app = { services: {} };
    new FileLoader({
      directory: path.join(dirBase, 'babel'),
      target: app.services,
    }).load();
    const instance = new app.services.UserProxy();
    assert.deepEqual(instance.getUser(), { name: 'xiaochen.gaoxc' });
  });

  it.skip('should only load property match the filers', () => {
    const app = { middlewares: {} };
    new FileLoader({
      directory: [
        path.join(dirBase, 'middlewares/default'),
        path.join(dirBase, 'middlewares/app'),
      ],
      target: app.middlewares,
      call: false,
      filters: [ 'm1', 'm2', 'dm1', 'dm2' ],
    }).load();
    assert(app.middlewares.m1);
    assert(app.middlewares.m2);
    assert(app.middlewares.dm1);
    assert(app.middlewares.dm2);
  });

  it('should support ignore string', () => {
    const app = { services: {} };
    new FileLoader({
      directory: path.join(dirBase, 'ignore'),
      target: app.services,
      ignore: 'util/**',
    }).load();
    assert.deepEqual(app.services.a, { a: 1 });
  });

  it('should support ignore array', () => {
    const app = { services: {} };
    new FileLoader({
      directory: path.join(dirBase, 'ignore'),
      target: app.services,
      ignore: [ 'util/a.js', 'util/b/b.js' ],
    }).load();
    assert.deepEqual(app.services.a, { a: 1 });
  });

  it('should support lowercase first letter', () => {
    const app = { services: {} };
    new FileLoader({
      directory: path.join(dirBase, 'lowercase'),
      target: app.services,
      lowercaseFirst: true,
    }).load();
    assert(app.services.someClass);
    assert(app.services.someDir);
    assert(app.services.someDir.someSubClass);
  });

  it('should support options.initializer with es6 class', () => {
    const app = { dao: {} };
    new FileLoader({
      directory: path.join(dirBase, 'dao'),
      target: app.dao,
      ignore: 'util/**',
      initializer(exports, opt) {
        return new exports(app, opt.path);
      },
    }).load();
    assert(app.dao.TestClass);
    assert.deepEqual(app.dao.TestClass.user, { name: 'kai.fangk' });
    assert(app.dao.TestClass.app === app);
    assert(app.dao.TestClass.path === path.join(dirBase, 'dao/TestClass.js'));
    assert.deepEqual(app.dao.testFunction, { user: { name: 'kai.fangk' } });
    assert.deepEqual(app.dao.testReturnFunction, { user: { name: 'kai.fangk' } });
  });

  it('should pass es6 module', () => {
    const app = { model: {} };
    new FileLoader({
      directory: path.join(dirBase, 'es6_module'),
      target: app.model,
    }).load();
    assert.deepEqual(app.model.mod, { a: 1 });
  });

  it('should contain syntax error filepath', () => {
    const app = { model: {} };
    assert.throws(() => {
      new FileLoader({
        directory: path.join(dirBase, 'syntax_error'),
        target: app.model,
      }).load();
    }, /Parse Error:/);
  });

  it('should throw when directory contains dot', () => {
    const mod = {};
    assert.throws(() => {
      new FileLoader({
        directory: path.join(dirBase, 'error/dotdir'),
        target: mod,
      }).load();
    }, /dot.dir is not match 'a-z0-9_-' in dot.dir\/a.js/);
  });

  it('should throw when directory contains underscore', () => {
    const mod = {};
    assert.throws(() => {
      new FileLoader({
        directory: path.join(dirBase, 'error/underscore-dir'),
        target: mod,
      }).load();
    }, /_underscore is not match 'a-z0-9_-' in _underscore\/a.js/);
    assert.throws(() => {
      new FileLoader({
        directory: path.join(dirBase, 'error/underscore-file-in-dir'),
        target: mod,
      }).load();
    }, /_a is not match 'a-z0-9_-' in dir\/_a.js/);
  });

  it('should throw when file starts with underscore', () => {
    const mod = {};
    assert.throws(() => {
      new FileLoader({
        directory: path.join(dirBase, 'error/underscore-file'),
        target: mod,
      }).load();
    }, /_private is not match 'a-z0-9_-' in _private.js/);
  });

  describe('caseStyle', () => {
    it('should load when caseStyle = upper', () => {
      const target = {};
      new FileLoader({
        directory: path.join(dirBase, 'camelize'),
        target,
        caseStyle: 'upper',
      }).load();

      assert(target.FooBar1);
      assert(target.FooBar2);
      assert(target.FooBar3);
      assert(target.FooBar4);
    });

    it('should load when caseStyle = camel', () => {
      const target = {};
      new FileLoader({
        directory: path.join(dirBase, 'camelize'),
        target,
        caseStyle: 'camel',
      }).load();

      assert(target.fooBar1);
      assert(target.fooBar2);
      assert(target.FooBar3);
      assert(target.fooBar4);
    });

    it('should load when caseStyle = lower', () => {
      const target = {};
      new FileLoader({
        directory: path.join(dirBase, 'camelize'),
        target,
        caseStyle: 'lower',
      }).load();

      assert(target.fooBar1);
      assert(target.fooBar2);
      assert(target.fooBar3);
      assert(target.fooBar4);
    });

    it('should load when caseStyle is function', () => {
      const target = {};
      new FileLoader({
        directory: path.join(dirBase, 'camelize'),
        target,
        caseStyle(filepath) {
          return filepath
            .replace('.js', '')
            .split('/')
            .map(property => property.replace(/_/g, ''));
        },
      }).load();

      assert(target.foobar1);
      assert(target.fooBar2);
      assert(target.FooBar3);
      assert(target['foo-bar4']);
    });

    it('should throw when caseStyle do not return array', () => {
      const target = {};
      assert.throws(() => {
        new FileLoader({
          directory: path.join(dirBase, 'camelize'),
          target,
          caseStyle(filepath) {
            return filepath;
          },
        }).load();
      }, /caseStyle expect an array, but got foo_bar1.js/);
    });

    it('should be overridden by lowercaseFirst', () => {
      const target = {};
      new FileLoader({
        directory: path.join(dirBase, 'camelize'),
        target,
        caseStyle: 'upper',
        lowercaseFirst: true,
      }).load();

      assert(target.fooBar1);
      assert(target.fooBar2);
      assert(target.fooBar3);
      assert(target.fooBar4);
    });
  });

  it('should load files with inject', () => {
    const inject = {};
    const target = {};
    new FileLoader({
      directory: path.join(dirBase, 'inject'),
      target,
      inject,
    }).load();

    assert(inject.b === true);

    new target.a(inject);
    assert(inject.a === true);
  });

  it('should load files with filter', () => {
    const target = {};
    new FileLoader({
      directory: path.join(dirBase, 'filter'),
      target,
      filter(obj) {
        return Array.isArray(obj);
      },
    }).load();
    assert.deepEqual(Object.keys(target), [ 'arr' ]);

    new FileLoader({
      directory: path.join(dirBase, 'filter'),
      target,
      filter(obj) {
        return is.class(obj);
      },
    }).load();
    assert.deepEqual(Object.keys(target), [ 'arr', 'class' ]);
  });
});
