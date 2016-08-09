'use strict';

const path = require('path');
const Router = require('../../utils/router');

module.exports = {

  /**
   * 加载 app/proxy 目录下的文件
   *
   * 1. 加载应用 app/proxy
   * 2. 加载插件 app/proxy
   *
   * @method EggLoader#loadProxy
   * @param {Object} opt - loading 参数
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
