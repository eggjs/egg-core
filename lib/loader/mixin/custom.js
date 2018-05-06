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
    this.timing.start('Load app.js');
    this.getLoadUnits()
      .forEach(unit => this.loadFile(path.join(unit.path, 'app.js')));
    this.timing.end('Load app.js');
  },

  /**
   * Load agent.js, same as {@link EggLoader#loadCustomApp}
   */
  loadCustomAgent() {
    this.timing.start('Load agent.js');
    this.getLoadUnits()
      .forEach(unit => this.loadFile(path.join(unit.path, 'agent.js')));
    this.timing.start('Load agent.js');
  },

};
