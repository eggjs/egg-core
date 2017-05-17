'use strict';

const path = require('path');

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
    this.getLoadUnits()
      .forEach(unit => this.loadFile(path.join(unit.path, 'app.js')));
  },

  /**
   * Load agent.js, same as {@link EggLoader#loadCustomApp}
   */
  loadCustomAgent() {
    this.getLoadUnits()
      .forEach(unit => this.loadFile(path.join(unit.path, 'agent.js')));
  },

};
