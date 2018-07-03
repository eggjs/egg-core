'use strict';

const path = require('path');
const is = require('is-type-of');
const BOOTS = Symbol.for('EggCore#boots');


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
    this.app[BOOTS] = this.getLoadUnits()
      .map(unit =>
        this.loadFile(this.resolveModule(path.join(unit.path, 'app')))
      )
      .filter(t => is.class(t))
      .map(t => new t(this.app));
    this.timing.end('Load app.js');
    this.app[Symbol.for('EggCore#triggerConfigDidLoad')]();
  },

  /**
   * Load agent.js, same as {@link EggLoader#loadCustomApp}
   */
  loadCustomAgent() {
    this.timing.start('Load agent.js');
    this.app[BOOTS] = this.getLoadUnits()
      .map(unit => this.loadFile(this.resolveModule(path.join(unit.path, 'agent'))))
      .filter(t => is.class(t))
      .map(t => new t(this.app));
    this.timing.end('Load agent.js');
    this.app[Symbol.for('EggCore#triggerConfigDidLoad')]();
  },

};
