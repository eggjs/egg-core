const assert = require('assert');
const Lifecycle = require('../lib/lifecycle.js');
const EggCore = require('..').EggCore;

describe('test/lifecycle.js', () => {
  it('should forbid adding hook atfter initialization', () => {
    const lifecycle = new Lifecycle({
      baseDir: '.',
      app: new EggCore(),
    });

    lifecycle.init();
    assert.throws(() => {
      lifecycle.addBootHook(
        class Hook {
          constructor(app) {
            this.app = app;
          }
          configDidLoad() {
            console.log('test');
          }
        }
      );
    }, /do not add hook when lifecycle has been initialized/);

    assert.throws(() => {
      lifecycle.addBootHook(() => {
        console.log('test');
      });
    }, /do not add hook when lifecycle has been initialized/);
  });
});
