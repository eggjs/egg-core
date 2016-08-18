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
    // 增加对 app/router/index.js 的支持? 当 router 比较多的时候有分文件的需求
    this.loadFile(path.join(this.options.baseDir, 'app/router.js'));
  },
};
