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
   *   // if you will invork asynchronous, you can use readyCallback
   *   const done = app.readyCallback();
   *   doAsync(done);
   * }
   * ```
   */
  loadCustomApp() {
    this.loadDirs()
      .forEach(dir => this.loadFile(path.join(dir, 'app.js')));
  },

  /**
   * Load agent.js, same as {@link EggLoader#loadCustomApp}
   */
  loadCustomAgent() {
    this.loadDirs()
      .forEach(dir => this.loadFile(path.join(dir, 'agent.js')));
  },

};
