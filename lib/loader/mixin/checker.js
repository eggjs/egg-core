'use strict';

const path = require('path');
const is = require('is-type-of');
const assert = require('assert');

module.exports = {
  loadChecker(opt) {
    opt = Object.assign({
      caseStyle: 'lower',
      directory: path.join(this.options.baseDir, 'app/checker'),
      initializer: (obj, opt) => {
        const { pathName, path } = opt;
        assert(is.function(obj) && !is.generatorFunction(obj) && !is.asyncFunction(obj), `${path} checker should be function or class`);
        if (is.function(obj) && !is.class(obj)) {
          obj = obj(this.app);
        }
        if (is.class(obj)) {
          obj.prototype.pathName = pathName;
          obj.prototype.fullPath = path;
          assert(is.function(obj.prototype.check), `${path} checker should have check method`);
          return new obj(this.app);
        }
        if (is.function(obj)) {
          return () => obj;
        }
        /* istanbul ignore next */
        assert.fail(`${path} checker is invalidate`);
      },
    }, opt);
    const checkerBase = opt.directory;

    this.loadToApp(checkerBase, 'checker', opt);
    this.options.logger.info('[egg:loader] Checker loaded: %s', checkerBase);
  },
};
