'use strict';

const path = require('path');


module.exports = {

  /**
   * Load app/router.js
   * @method EggLoader#loadRouter
   * @param {Object} opt - LoaderOptions
   * @since 1.0.0
   */
  loadRouter() {
    this.timing.start('Load Router');
    // 加载 router.js
<<<<<<< HEAD
    this.loadFile(this.resolveModule(path.join(this.options.baseDir, 'app/router')));
=======
    this.loadFile(path.join(this.options.baseDir, 'app/router.js'));
    this.timing.end('Load Router');
>>>>>>> 5609d12... feat: add timing data for loader (#160)
  },
};
