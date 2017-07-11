'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

class Plugin {

  // opt
  //   enable
  //   path
  //   package
  //   baseDir
  //   eggPaths
  //   logger
  constructor(name) {
    assert(name, 'name is required when create node');
    // set properties of plugin
    this.name = name;
    this.enable = true;
    this.dependencies = [];
    this.optionalDependencies = [];
    this.env = [];
    this.from = '';
    this.path = '';
    this.package = '';
  }

  mergeConfig(config, from) {
    if (from) this.from = from;

    if (typeof config === 'boolean') {
      config = { enable: config };
    }

    if (this.package && this.package === config.package) {
      this.logger.warn('plugin %s has been defined that is %j, but you define again in %s',
        this.name, this, this.from);
    }

    if (config.path || config.package) {
      this.path = '';
      this.package = '';
    }

    depCompatible(config);

    const properties = [
      'path',
      'package',
      'dependencies',
      'optionalDependencies',
      'env',
      'enable',
    ];
    for (const property of properties) {
      const value = config[property];
      if (isBoolean(value) || isExistArray(value) || isString(value)) {
        this[property] = value;
      }
    }
  }

  // Get the real plugin path
  getPluginPath() {
    const opt = this.opt;
    if (opt.path) {
      this.path = opt.path;
      return;
    }

    const name = opt.package || this.name;
    const lookupDirs = [];

    // 尝试在以下目录找到匹配的插件
    //  -> {APP_PATH}/node_modules
    //    -> {EGG_PATH}/node_modules
    //      -> $CWD/node_modules
    lookupDirs.push(path.join(opt.baseDir, 'node_modules'));

    // 到 egg 中查找，优先从外往里查找
    for (let i = opt.eggPaths.length - 1; i >= 0; i--) {
      const eggPath = opt.eggPaths[i];
      lookupDirs.push(path.join(eggPath, 'node_modules'));
    }

    // should find the $cwd/node_modules when test the plugins under npm3
    lookupDirs.push(path.join(process.cwd(), 'node_modules'));

    for (let dir of lookupDirs) {
      dir = path.join(dir, name);
      if (fs.existsSync(dir)) {
        return fs.realpathSync(dir);
      }
    }

    throw new Error(`Can not find opt ${name} in "${lookupDirs.join(', ')}"`);
  }


  // Read plugin information from package.json and merge
  // {
  //   eggPlugin: {
  //     "name": "",    plugin name, must be same as name in config/plugin.js
  //     "dep": [],     dependent plugins
  //     "env": ""      env
  //   }
  // }
  mergePluginConfig() {
    const opt = this.opt;
    let pkg;
    let config;
    const pluginPackage = path.join(this.path, 'package.json');
    if (fs.existsSync(pluginPackage)) {
      pkg = require(pluginPackage);
      config = pkg.eggPlugin;
      if (pkg.version) {
        this.version = pkg.version;
      }
    }

    const logger = opt.logger;
    if (!config) {
      logger.warn(`[egg:loader] pkg.eggPlugin is missing in ${pluginPackage}`);
      return;
    }

    if (config.name && config.name !== this.name) {
      // pluginName is configured in config/plugin.js
      // pluginConfigName is pkg.eggPath.name
      logger.warn(`[egg:loader] pluginName(${this.name}) is different from pluginConfigName(${config.name})`);
    }

    // dep compatible
    if (config.dep && !(Array.isArray(config.dependencies) && config.dependencies.length)) {
      config.dependencies = config.dep;
      delete config.dep;
    }

    for (const key of [ 'dependencies', 'optionalDependencies', 'env' ]) {
      if (!this[key].length && Array.isArray(config[key])) {
        this[key] = config[key];
      }
    }
  }

}

module.exports = Plugin;

function isBoolean(val) {
  return typeof val === 'boolean';
}

function isString(val) {
  return typeof val === 'string';
}

function isExistArray(val) {
  return Array.isArray(val) && val.length > 0;
}

function depCompatible(config) {
  if (config.dep && !(Array.isArray(config.dependencies) && config.dependencies.length)) {
    config.dependencies = config.dep;
    delete config.dep;
  }
}
