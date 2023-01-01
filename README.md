# egg-core

[![NPM version][npm-image]][npm-url]
[![Node.js CI](https://github.com/eggjs/egg-core/actions/workflows/nodejs.yml/badge.svg)](https://github.com/eggjs/egg-core/actions/workflows/nodejs.yml)
[![Test coverage][codecov-image]][codecov-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-core.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-core
[codecov-image]: https://codecov.io/github/eggjs/egg-core/coverage.svg?branch=master
[codecov-url]: https://codecov.io/github/eggjs/egg-core?branch=master
[snyk-image]: https://snyk.io/test/npm/egg-core/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-core
[download-image]: https://img.shields.io/npm/dm/egg-core.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-core

A core Pluggable framework based on [koa](https://github.com/koajs/koa).

**Don't use it directly, see [egg].**

## Usage

Directory structure

```
├── package.json
├── app.js (optional)
├── agent.js (optional)
├── app
|   ├── router.js
│   ├── controller
│   │   └── home.js
|   ├── extend (optional)
│   |   ├── helper.js (optional)
│   |   ├── filter.js (optional)
│   |   ├── request.js (optional)
│   |   ├── response.js (optional)
│   |   ├── context.js (optional)
│   |   ├── application.js (optional)
│   |   └── agent.js (optional)
│   ├── service (optional)
│   ├── middleware (optional)
│   │   └── response_time.js
│   └── view (optional)
|       ├── layout.html
│       └── home.html
├── config
|   ├── config.default.js
│   ├── config.prod.js
|   ├── config.test.js (optional)
|   ├── config.local.js (optional)
|   ├── config.unittest.js (optional)
│   └── plugin.js
```

Then you can start with code below

```js
const Application = require('egg-core').EggCore;
const app = new Application({
  baseDir: '/path/to/app'
});
app.ready(() => app.listen(3000));
```

## EggLoader

EggLoader can easily load files or directories in your [egg] project. In addition, you can customize the loader with low level APIs.

### constructor

- {String} baseDir - current directory of application
- {Object} app - instance of egg application
- {Object} plugins - merge plugins for test
- {Logger} logger - logger instance，default is console

### High Level APIs

#### loadPlugin

Load config/plugin.js

#### loadConfig

Load config/config.js and config/{serverEnv}.js

If `process.env.EGG_APP_CONFIG` is exists, then it will be parse and override config.

#### loadController

Load app/controller

#### loadMiddleware

Load app/middleware

#### loadApplicationExtend

Load app/extend/application.js

#### loadContextExtend

Load app/extend/context.js

#### loadRequestExtend

Load app/extend/request.js

#### loadResponseExtend

Load app/extend/response.js

#### loadHelperExtend

Load app/extend/helper.js

#### loadCustomApp

Load app.js, if app.js export boot class, then trigger configDidLoad

#### loadCustomAgent

Load agent.js, if agent.js export boot class, then trigger configDidLoad

#### loadService

Load app/service

### Low Level APIs

#### getServerEnv()

Retrieve application environment variable values via `serverEnv`. You can access directly by calling `this.serverEnv` after instantiation.

serverEnv | description
---       | ---
default   | default environment
test      | system integration testing environment
prod      | production environment
local     | local environment on your own computer
unittest  | unit test environment

#### getEggPaths()

To get directories of the frameworks. A new framework is created by extending egg, then you can use this function to get all frameworks.

#### getLoadUnits()

A loadUnit is a directory that can be loaded by EggLoader, cause it has the same structure.

This function will get add loadUnits follow the order:

1. plugin
2. framework
3. app

loadUnit has a path and a type. Type must be one of those values: *app*, *framework*, *plugin*.

```js
{
  path: 'path/to/application',
  type: 'app'
}
```

#### getAppname()

To get application name from *package.json*

#### appInfo

Get the infomation of the application

- pkg: `package.json`
- name: the application name from `package.json`
- baseDir: current directory of application
- env: equals to serverEnv
- HOME: home directory of the OS
- root: baseDir when local and unittest, HOME when other environment

#### loadFile(filepath)

To load a single file. **Note:** The file must export as a function.

#### loadToApp(directory, property, LoaderOptions)

To load files from directory in the application.

Invoke `this.loadToApp('$baseDir/app/controller', 'controller')`, then you can use it by `app.controller`.

#### loadToContext(directory, property, LoaderOptions)

To load files from directory, and it will be bound the context.

```js
// define service in app/service/query.js
module.exports = class Query {
  constructor(ctx) {
    super(ctx);
    // get the ctx
  }

  async get() {}
};

// use the service in app/controller/home.js
module.exports = async ctx => {
  ctx.body = await ctx.service.query.get();
};
```

#### loadExtend(name, target)

Loader app/extend/xx.js to target, For example,

```js
this.loadExtend('application', app);
```

### LoaderOptions

Param          | Type           | Description
-------------- | -------------- | ------------------------
directory      | `String/Array` | directories to be loaded
target         | `Object`       | attach the target object from loaded files
match          | `String/Array` | match the files when load, default to `**/*.js`(if process.env.EGG_TYPESCRIPT was true, default to `[ '**/*.(js|ts)', '!**/*.d.ts' ]`)
ignore         | `String/Array` | ignore the files when load
initializer    | `Function`     | custom file exports, receive two parameters, first is the inject object(if not js file, will be content buffer), second is an `options` object that contain `path`
caseStyle      | `String/Function` | set property's case when converting a filepath to property list.
override       | `Boolean`      | determine whether override the property when get the same name
call           | `Boolean`      | determine whether invoke when exports is function
inject         | `Object`       | an object that be the argument when invoke the function
filter         | `Function`     | a function that filter the exports which can be loaded

## Timing

EggCore record boot progress with `Timing`, include:
- Process start time
- Script start time(node don't implement an interface like `process.uptime` to record the script start running time, framework can implement a prestart file used with node `--require` options to set `process.scriptTime`)
- Application start time
- Load duration
- `require` duration

### start

Start record a item. If the item exits, end the old one and start a new one.

- {String} name - record item name
- {Number} [start] - record item start time, default is Date.now()

### end

End a item.

- {String} name - end item name

### toJSON

Generate all record items to json

- {String} name - record item name
- {Number} start - item start time
- {Number} end - item end time
- {Number} duration - item duration
- {Number} pid - pid
- {Number} index - item index

## Questions & Suggestions

Please open an issue [here](https://github.com/eggjs/egg/issues).

## License

[MIT](LICENSE)

[egg]: https://github.com/eggjs/egg
<!-- GITCONTRIBUTOR_START -->

## Contributors

|[<img src="https://avatars.githubusercontent.com/u/360661?v=4" width="100px;"/><br/><sub><b>popomore</b></sub>](https://github.com/popomore)<br/>|[<img src="https://avatars.githubusercontent.com/u/985607?v=4" width="100px;"/><br/><sub><b>dead-horse</b></sub>](https://github.com/dead-horse)<br/>|[<img src="https://avatars.githubusercontent.com/u/156269?v=4" width="100px;"/><br/><sub><b>fengmk2</b></sub>](https://github.com/fengmk2)<br/>|[<img src="https://avatars.githubusercontent.com/u/227713?v=4" width="100px;"/><br/><sub><b>atian25</b></sub>](https://github.com/atian25)<br/>|[<img src="https://avatars.githubusercontent.com/u/5856440?v=4" width="100px;"/><br/><sub><b>whxaxes</b></sub>](https://github.com/whxaxes)<br/>|[<img src="https://avatars.githubusercontent.com/u/1207064?v=4" width="100px;"/><br/><sub><b>gxcsoccer</b></sub>](https://github.com/gxcsoccer)<br/>|
| :---: | :---: | :---: | :---: | :---: | :---: |
|[<img src="https://avatars.githubusercontent.com/u/6897780?v=4" width="100px;"/><br/><sub><b>killagu</b></sub>](https://github.com/killagu)<br/>|[<img src="https://avatars.githubusercontent.com/u/2170848?v=4" width="100px;"/><br/><sub><b>iyuq</b></sub>](https://github.com/iyuq)<br/>|[<img src="https://avatars.githubusercontent.com/u/5243774?v=4" width="100px;"/><br/><sub><b>ngot</b></sub>](https://github.com/ngot)<br/>|[<img src="https://avatars.githubusercontent.com/u/17722900?v=4" width="100px;"/><br/><sub><b>initial-wu</b></sub>](https://github.com/initial-wu)<br/>|[<img src="https://avatars.githubusercontent.com/u/1763067?v=4" width="100px;"/><br/><sub><b>waitingsong</b></sub>](https://github.com/waitingsong)<br/>|[<img src="https://avatars.githubusercontent.com/u/7315743?v=4" width="100px;"/><br/><sub><b>AnzerWall</b></sub>](https://github.com/AnzerWall)<br/>|
|[<img src="https://avatars.githubusercontent.com/u/174904?v=4" width="100px;"/><br/><sub><b>army8735</b></sub>](https://github.com/army8735)<br/>|[<img src="https://avatars.githubusercontent.com/u/5938871?v=4" width="100px;"/><br/><sub><b>njugray</b></sub>](https://github.com/njugray)<br/>|[<img src="https://avatars.githubusercontent.com/u/327019?v=4" width="100px;"/><br/><sub><b>JacksonTian</b></sub>](https://github.com/JacksonTian)<br/>|[<img src="https://avatars.githubusercontent.com/u/16460813?v=4" width="100px;"/><br/><sub><b>JimmyDaddy</b></sub>](https://github.com/JimmyDaddy)<br/>|[<img src="https://avatars.githubusercontent.com/u/2842176?v=4" width="100px;"/><br/><sub><b>XadillaX</b></sub>](https://github.com/XadillaX)<br/>|[<img src="https://avatars.githubusercontent.com/u/6913898?v=4" width="100px;"/><br/><sub><b>monkindey</b></sub>](https://github.com/monkindey)<br/>|
|[<img src="https://avatars.githubusercontent.com/u/1148428?v=4" width="100px;"/><br/><sub><b>mattma</b></sub>](https://github.com/mattma)<br/>|[<img src="https://avatars.githubusercontent.com/u/456108?v=4" width="100px;"/><br/><sub><b>shaoshuai0102</b></sub>](https://github.com/shaoshuai0102)<br/>|[<img src="https://avatars.githubusercontent.com/u/7530656?v=4" width="100px;"/><br/><sub><b>zhang740</b></sub>](https://github.com/zhang740)<br/>|[<img src="https://avatars.githubusercontent.com/u/457552?v=4" width="100px;"/><br/><sub><b>dsonet</b></sub>](https://github.com/dsonet)<br/>|[<img src="https://avatars.githubusercontent.com/u/3995814?v=4" width="100px;"/><br/><sub><b>chenbin92</b></sub>](https://github.com/chenbin92)<br/>|[<img src="https://avatars.githubusercontent.com/u/19908330?v=4" width="100px;"/><br/><sub><b>hyj1991</b></sub>](https://github.com/hyj1991)<br/>|
[<img src="https://avatars.githubusercontent.com/u/8816730?v=4" width="100px;"/><br/><sub><b>maxming2333</b></sub>](https://github.com/maxming2333)<br/>|[<img src="https://avatars.githubusercontent.com/u/26317926?v=4" width="100px;"/><br/><sub><b>supperchong</b></sub>](https://github.com/supperchong)<br/>|[<img src="https://avatars.githubusercontent.com/u/18463189?v=4" width="100px;"/><br/><sub><b>ZhangDianPeng</b></sub>](https://github.com/ZhangDianPeng)<br/>|[<img src="https://avatars.githubusercontent.com/u/15242708?v=4" width="100px;"/><br/><sub><b>mosaic101</b></sub>](https://github.com/mosaic101)<br/>

This project follows the git-contributor [spec](https://github.com/xudafeng/git-contributor), auto updated at `Wed Nov 24 2021 22:24:39 GMT+0800`.

<!-- GITCONTRIBUTOR_END -->
