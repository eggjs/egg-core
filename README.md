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

A core Plugable framework based on koa

**Don't use it directly, see [egg]**

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

Than you can start with code below

```js
const Application = require('egg-core').Application;
const app = new Application({
  baseDir: '/path/to/app'
});
app.ready(() => {
  app.listen(3000);
});
```

## EggLoader

EggLoader will load file or directory easily, you can also custom your loader with low level API.

### constructor

- {String} baseDir - current directory of application
- {Object} app - instance of egg application
- {Object} plugins - merge plugins for test
- {Logger} logger - logger instance，default is console

### High Level API

#### loadPlugin

Load config/plugin.js

#### loadConfig

Load config/config.js and config/{serverEnv}.js

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

Load app.js

#### loadCustomAgent

Load agent.js

#### loadService

Load app/service

### Low Level API

#### getServerEnv()

Get serverEnv for application, available serverEnv

serverEnv | description
---       | ---
default   | default environment
test      | system integration testing environment
prod      | production environment
local     | local environment on your own computer
unittest  | unit test environment

You can use this.serverEnv directly after instantiation.

#### getEggPaths()

Get the directory of the frameworks, a new framework born by extending egg, then you can use this function to get all frameworks.

#### getLoadUnits()

A loadUnit is a directory that can be loaded by EggLoader, it has the same structure.

This function will get add loadUnits follow the order:

1. plugin
2. framework
3. app

loadUnit has a path and a type(app, framework, plugin).

```js
{
  path: 'path/to/application',
  type: 'app',
}
```

#### getAppname()

Get appname from package.json

#### loadFile(filepath)

Load single file, will invork when export is function.

#### loadToApp(directory, property, LoaderOptions)

Load the files in directory to app.

Invoke `this.loadToApp('$baseDir/app/controller', 'controller')`, then you can use it by `app.controller`.

#### loadToContext(directory, property, LoaderOptions)

Load the files in directory to context, it will bind the context.

```
// define service in app/service/query.js
module.exports = class Query {
  constructor(ctx) {
    // get the ctx
  }

  get() {}
};

// use the service in app/controller/home.js
module.exports = function*() {
  this.body = this.service.query.get();
};
```

#### loadExtend(name, target)

Loader app/extend/xx.js to target, example

```js
this.loadExtend('application', app);
```

### LoaderOptions

- {String|Array} directory - directories to load
- {Object} target: attach object from loaded files,
- {String} ignore - ignore the files when load
- {Function} initializer - custom file exports
- {Boolean} lowercaseFirst - determine whether the fist letter is lowercase
- {Boolean} override: determine whether override the property when get the same name
- {Boolean} call - determine whether invoke when exports is function
- {Object} inject - an object that be the argument when invoke the function

[egg]: https://github.com/eggjs/egg
