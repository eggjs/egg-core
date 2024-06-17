import { strict as assert } from 'node:assert';
import mm from 'mm';
import { Application, createApp, getFilepath } from '../helper.js';
import { EggLoader, EggCore } from '../../src/index.js';

describe('test/loader/get_framework_paths.test.ts', () => {
  let app: Application;
  afterEach(mm.restore);
  afterEach(() => app && app.close());

  it('should get from paramter', () => {
    app = createApp('eggpath');
    assert.deepEqual(app.loader.eggPaths, [ getFilepath('egg-esm') ]);
  });

  it('should get from framework using symbol', async () => {
    app = createApp('eggpath', {
      Application: (await import(getFilepath('framework-symbol/index.js'))).default,
    });
    assert.deepEqual(app.loader.eggPaths, [
      getFilepath('egg'),
      getFilepath('framework-symbol/node_modules/framework2'),
      getFilepath('framework-symbol'),
    ]);
  });

  it.skip('should throw when one of the Application do not specify symbol', async () => {
    const AppClass = (await import(getFilepath('framework-nosymbol/index.js'))).default;
    assert.throws(() => {
      const app = createApp('eggpath', {
        Application: AppClass,
      });
      console.log(app);
    }, /Symbol.for\('egg#eggPath'\) is required on Application/);
  });

  it('should remove dulplicate eggPath', async () => {
    app = createApp('eggpath', {
      Application: (await import(getFilepath('framework-dulp/index.js'))).default,
    });
    assert.deepEqual(app.loader.eggPaths, [
      getFilepath('egg'),
      getFilepath('framework-dulp'),
    ]);
  });

  it('should when Application do not extend EggCore', () => {
    class CustomApplication {
      loader: EggLoader;
      constructor() {
        this.loader = new EggLoader({
          baseDir: getFilepath('eggpath'),
          app: this,
          logger: console,
          EggCoreClass: EggCore,
        } as any);
      }
      get [Symbol.for('egg#eggPath')]() {
        return getFilepath('egg-esm');
      }
      close() {}
    }

    app = createApp('eggpath', {
      Application: CustomApplication as any,
    });
    assert.equal(app.loader.eggPaths.length, 1);
    assert.equal(app.loader.eggPaths[0], getFilepath('egg-esm'));
  });

  it('should assert eggPath type', async () => {
    await assert.rejects(async () => {
      createApp('eggpath', {
        Application: (await import(getFilepath('framework-wrong-eggpath/index.js'))).default,
      });
    }, /Symbol.for\('egg#eggPath'\) should be string/);
  });
});
