'use strict';

const path = require('path');
const is = require('is-type-of');

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
   *   // if you will invoke asynchronous, you can use readyCallback
   *   const done = app.readyCallback();
   *   doAsync(done);
   * }
   * ```
   * @since 1.0.0
   */
  loadCustomApp() {
    this.timing.start('Load app.js');
    this.getLoadUnits().forEach(unit => {
      const fullPath = path.join(unit.path, 'app.js');
      const mod = this.loadFile(fullPath);
      if (is.class(mod)) throw new Error(`${fullPath} is not support class at this version, please upgrade your framework`);
    });
    this.timing.end('Load app.js');
  },

  /**
   * Load agent.js, same as {@link EggLoader#loadCustomApp}
   */
  loadCustomAgent() {
    this.timing.start('Load agent.js');
    this.getLoadUnits().forEach(unit => {
      const fullPath = path.join(unit.path, 'agent.js');
      const mod = this.loadFile(fullPath);
      if (is.class(mod)) throw new Error(`${fullPath} is not support class at this version, please upgrade your framework`);
    });
    this.timing.end('Load agent.js');
  },
};
