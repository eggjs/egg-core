# egg-loader

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-loader.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-loader
[travis-image]: https://img.shields.io/travis/eggjs/egg-loader.svg?style=flat-square
[travis-url]: https://travis-ci.org/eggjs/egg-loader
[codecov-image]: https://codecov.io/github/eggjs/egg-loader/coverage.svg?branch=master
[codecov-url]: https://codecov.io/github/eggjs/egg-loader?branch=master
[david-image]: https://img.shields.io/david/eggjs/egg-loader.svg?style=flat-square
[david-url]: https://david-dm.org/eggjs/egg-loader
[snyk-image]: https://snyk.io/test/npm/egg-loader/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-loader
[download-image]: https://img.shields.io/npm/dm/egg-loader.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-loader

egg 文件加载器

## 使用说明

```js
const app = koa();
const Loader = require('egg-loader');
const loader = new Loader({
  baseDir: '/path/to/app',
  eggPath: '/path/to/framework',
  app: app,
});
loader.loadPlugin();
loader.loadConfig();
```

## API

### options

- baseDir: 应用根目录
- eggPath: egg 本身的路径
- plugins: 自定义插件配置
- app: 任何基于 koa 实例化

### methods

基础方式

- loadFile: 加载单文件，
- loadDirs: 获取需要加载的所有目录，按照 egg > 插件 > 框架 > 应用的顺序加载。

业务方法

- getAppname: 获取应用名
- loadServerEnv: 加载环境变量
- loadConfig: 加载: config
- loadPlugin: 加载插件
- loadApplication: 加载 extend/application.js 到 app
- loadRequest: 加载 extend/request.js 到 app.request
- loadResponse: 加载 extend/response.js 到 app.response
- loadContext: 加载 extend/context.js 到 app.context
- loadHelper: 加载 extend/helper.js，到 app.Helper.prototype，需要定义 app.Helper 才会加载
- loadService: 加载 app/service 到 app.service
- loadProxy: 加载 app/proxy 到 app.proxy
- loadMiddleware: 加载中间件
- loadController: 加载 app/controller 到 app.controller
- loadAgent: 加载 agent.js 进行自定义
- loadApp: 加载 app.js 进行自定义

