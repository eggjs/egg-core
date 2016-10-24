'use strict';

const path = require('path');

const LOAD_CUSTOM_FILE = Symbol('EggCore#loadCustomFile');

module.exports = {

  /**
   * load app.js
   *
   * @example
   * ```js
   * module.exports = function(app) {
   *   // can do everything
   *   do();
   *
   *   // if you will invork asynchronous, you can use readyCallback
   *   const done = app.readyCallback();
   *   doAsync(done);
   * }
   * ```
   *
   * it's better to use async function
   *
   * ```js
   * module.exports = async function(app) {
   *   await doAsync();
   * }
   * ```
   *
   * Or use generator wrapped by co.wrap
   *
   * ```js
   * const co = require('co');
   * module.exports = co.wrap(function*(app) {
   *   yield doAsync();
   * });
   * ```
   * @since 1.0.0
   */
  loadCustomApp() {
    this[LOAD_CUSTOM_FILE]('app.js');
  },

  /**
   * Load agent.js, same as {@link EggLoader#loadCustomApp}
   */
  loadCustomAgent() {
    this[LOAD_CUSTOM_FILE]('agent.js');
  },

  [LOAD_CUSTOM_FILE](filename) {
    this.getLoadUnits()
      .forEach(unit => {
        const filepath = path.join(unit.path, filename);
        const ret = this.loadFile(filepath);
        registerCallback(ret, this.app, filepath);
      });
  },
};

function registerCallback(ret, app, filepath) {
  // register readyCallback if custom file export async function
  if (ret instanceof Promise) {
    const done = app.readyCallback(filepath);
    ret.then(() => done()).catch(done);
  }
}
