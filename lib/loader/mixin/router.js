'use strict';

const path = require('path');
const timing = require('../../utils/timing');


module.exports = {

  /**
   * Load app/router.js
   * @method EggLoader#loadRouter
   * @param {Object} opt - LoaderOptions
   * @since 1.0.0
   */
  loadRouter() {
    timing.start('loadRouter');
    // 加载 router.js
    this.loadFile(path.join(this.options.baseDir, 'app/router.js'));
    timing.end('loadRouter');
  },
};
