'use strict';

const is = require('is-type-of');
const path = require('path');

const LOAD_BOOT_HOOK = Symbol('Loader#loadBootHook');

module.exports = {

  /**
   * load app.js
   *
   * @example
   * - old:
   *
   * ```js
   * module.exports = function(app) {
   *   doSomething();
   * }
   * ```
   *
   * - new:
   *
   * ```js
   * module.exports = class Boot {
   *   constructor(app) {
   *     this.app = app;
   *   }
   *   configDidLoad() {
   *     doSomething();
   *   }
   * }
   * @since 1.0.0
   */
  loadCustomApp() {
    this[LOAD_BOOT_HOOK]('app');
    this.lifecycle.triggerConfigDidLoad();
  },

  /**
   * Load agent.js, same as {@link EggLoader#loadCustomApp}
   */
  loadCustomAgent() {
    this[LOAD_BOOT_HOOK]('agent');
    this.lifecycle.triggerConfigDidLoad();
  },

  // FIXME: no logger used after egg removed
  loadBootHook() {
    // do nothing
  },

  [LOAD_BOOT_HOOK](fileName) {
    this.timing.start(`Load ${fileName}.js`);
    for (const unit of this.getLoadUnits()) {
      const bootFilePath = this.resolveModule(path.join(unit.path, fileName));
      if (!bootFilePath) {
        continue;
      }
      const bootHook = this.requireFile(bootFilePath);
      if (is.class(bootHook)) {
        // if is boot class, add to lifecycle
        this.lifecycle.addBootHook(bootHook);
      } else {
        // if is boot function, wrap to class
        this.lifecycle.addFunctionAsBootHook(bootHook);
      }
    }
    // init boots
    this.lifecycle.init();
    this.timing.end(`Load ${fileName}.js`);
  },
};
