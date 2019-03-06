'use strict';

const assert = require('assert');
const path = require('path');

module.exports = {
  loadCustomLoader() {
    const loader = this;
    assert(loader.config, 'should loadConfig first');
    const customLoader = loader.config.customLoader || {};

    for (const property of Object.keys(customLoader)) {
      const loaderConfig = Object.assign({}, customLoader[property]);
      assert(loaderConfig.directory, `directory is required for config.customLoader.${property}`);

      let directory;
      if (loaderConfig.loadunit === true) {
        directory = this.getLoadUnits().map(unit => path.join(unit.path, loaderConfig.directory));
      } else {
        directory = path.join(loader.appInfo.baseDir, loaderConfig.directory);
      }
      // don't override directory
      delete loaderConfig.directory;

      const inject = loaderConfig.inject || 'app';
      // don't override inject
      delete loaderConfig.inject;

      switch (inject) {
        case 'ctx': {
          const defaultConfig = {
            caseStyle: 'lower',
            fieldClass: `${property}Classes`,
          };
          loader.loadToContext(directory, property, Object.assign(defaultConfig, loaderConfig));
          break;
        }
        case 'app': {
          const defaultConfig = {
            caseStyle: 'lower',
            initializer(Class) {
              return new Class(loader.app);
            },
          };
          loader.loadToApp(directory, property, Object.assign(defaultConfig, loaderConfig));
          break;
        }
        default:
          throw new Error('inject only support app or ctx');
      }
    }
  },
};
