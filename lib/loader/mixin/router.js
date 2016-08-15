'use strict';

const path = require('path');
const Router = require('../../utils/router');

module.exports = {

  /**
   * Load app/router.js
   * @method EggLoader#loadRouter
   * @param {Object} opt - LoaderOptions
   * @since 1.0.0
   */
  loadRouter() {
    const app = this.app;
    const router = new Router({ sensitive: true }, app);

    // 注册 Router 的 Middleware
    app.use(router.middleware());

    // 加载 router.js
    this.loadFile(path.join(this.options.baseDir, 'app/router.js'));
  },
};
