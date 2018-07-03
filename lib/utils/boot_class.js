'use strict';

class BootClass {
  /**
   * @constructor
   * @param {EggApplication} app - app instance
   */
  constructor(app) {
    this.app = app;

    /**
     * will be triggered after plugin.js, config.js,
     * extends, app.js/agent.js did loaded
     * @method configDidLoad
     */

    /**
     * will be triggered after all files did loaded
     * @async
     * @method didLoad
     */

    /**
     * all plugins are ready
     * @async
     * @method willReady
     */

    /**
     * after all `willReady` ready
     * @async
     * @method didReady
     */

    /**
     * all workers, agent is ready
     * @async
     * @method serverDidReady
     */

    /**
     * before process exit
     * not safe
     * @async
     * @method beforeClose
     */
  }
}

module.exports = BootClass;
