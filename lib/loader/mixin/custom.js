'use strict';

const path = require('path');
const timing = require('../../utils/timing');


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
    timing.start('load app.js');
    this.getLoadUnits()
      .forEach(unit => this.loadFile(path.join(unit.path, 'app.js')));
    timing.end('load app.js');
  },

  /**
   * Load agent.js, same as {@link EggLoader#loadCustomApp}
   */
  loadCustomAgent() {
    timing.start('load agent.js');
    this.getLoadUnits()
      .forEach(unit => this.loadFile(path.join(unit.path, 'agent.js')));
    timing.start('load agent.js');
  },

};
