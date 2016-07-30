'use strict';

const fs = require('fs');
const path = require('path');
const debug = require('debug')('egg:loader:plugin');
const interopRequire = require('interop-require');

const sequencify = require('./utils/sequencify');

module.exports = {

  /**
   * 根据配置加载插件，实现 loadPlugin() 接口
   *
   * 插件配置来自三个地方
   *
   * 1. 应用 config/plugin.js，优先级最高
   * 2. egg/lib/core/config/plugin.js，优先级次之。
   * 3. 插件本身的 package.json => eggPlugin 配置，优先级最低
   *
   * 具体的插件配置类似
   *
   * ```js
   * {
   *   'xxx-client': {
   *     enable: true,
   *     package: 'xxx-client',
   *     dep: [],
   *     env: [],
   *   },
   *   // 简写
   *   'rds': false,
   *   // 自定义路径，优先级最高
   *   'depd': {
   *     enable: true,
   *     path: 'path/to/depd'
   *   }
   * }
   * ```
   *
   * 根据配置从三个目录去加载插件，优先级依次降低
   *
   * 1. $APP_BASE/node_modules/${package or name}
   * 2. $EGG_BASE/node_modules/${package or name}
   * 3. $EGG_BASE/lib/plugins/${package or name}
   *
   * 加载后可通过 `loader.plugins` 访问已开启的插件
   *
   * ```js
   * loader.plugins['xxx-client'] = {
   *   name: 'xxx-client',                 // 模块名，模块依赖配置使用这个名字
   *   package: 'xxx-client',              // 包名，加载插件时会尝试使用包名加载
   *   enable: true,                       // 是否开启
   *   path: 'path/to/xxx-client',         // 插件路径
   *   dep: [],                            // 依赖的模块
   *   env: [ 'local', 'unittest' ],       // 只在这两个环境下开启才有效
   * }
   * ```
   *
   * 如需要访问所有插件可调用 `loader.allPlugins`
   * @method EggLoader#loadPlugin
   */
  loadPlugin() {
    // 读取 appPlugins，为应用配置
    const appPlugins = this.readPluginConfigs(path.join(this.options.baseDir, 'config/plugin.js'));
    debug('Loaded app plugins: %j', Object.keys(appPlugins));

    // 读取 eggPlugins，为框架和 egg 配置
    const eggPluginConfigPaths = this.eggPaths.map(eggPath => path.join(eggPath, 'lib/core/config/plugin.js'));
    const eggPlugins = this.readPluginConfigs(eggPluginConfigPaths);
    debug('Loaded egg plugins: %j', Object.keys(eggPlugins));

    // 自定义插件配置，一般用于单元测试
    let customPlugins;
    if (process.env.EGG_PLUGINS) {
      try {
        customPlugins = JSON.parse(process.env.EGG_PLUGINS);
      } catch (e) {
        debug('parse EGG_PLUGINS failed, %s', e);
      }
    }

    if (this.options.plugins) {
      customPlugins = Object.assign({}, customPlugins, this.options.plugins);
    }

    if (customPlugins) {
      for (const name in customPlugins) {
        this.normalizePluginConfig(customPlugins, name);
      }
      debug('Loaded custom plugins: %j', Object.keys(customPlugins));
    }

    // 合并所有插件
    this.allPlugins = {};
    extendPlugins(this.allPlugins, eggPlugins);
    extendPlugins(this.allPlugins, appPlugins);
    extendPlugins(this.allPlugins, customPlugins);

    // 过滤出环境不符的插件、以及被应用显示关闭的插件
    const enabledPluginNames = []; // 入口开启的插件列表，不包括被依赖的
    const plugins = {};
    const env = this.serverEnv;
    for (const name in this.allPlugins) {
      const plugin = this.allPlugins[name];

      // 根据 path/package 获取真正的插件路径，两者互斥
      plugin.path = this.getPluginPath(plugin, this.options.baseDir);

      // 从 eggPlugin 更新插件信息
      this.mergePluginConfig(plugin);

      // 只允许符合服务器环境 env 条件的插件开启
      if (env && plugin.env.length && plugin.env.indexOf(env) === -1) {
        debug('Disabled %j as env is %j, but got %j', name, plugin.env, env);
        plugin.enable = false;
        continue;
      }

      // app 的配置优先级最高，切不允许隐式的规则推翻 app 配置
      if (appPlugins[name] && !appPlugins[name].enable) {
        debug('Disabled %j as disabled by app', name);
        continue;
      }

      plugins[name] = plugin;

      if (plugin.enable) {
        enabledPluginNames.push(name);
      }
    }

    // 获取开启的插件，并排序
    this.orderPlugins = this.getOrderPlugins(plugins, enabledPluginNames);

    // 将数组转换成对象
    const enablePlugins = {};
    for (const plugin of this.orderPlugins) {
      enablePlugins[plugin.name] = plugin;
    }
    debug('Loaded plugins: %j', Object.keys(enablePlugins));

    /**
     * 获取 plugin 配置
     * @alias app.loader.plugins
     * @see Plugin
     * @member {Object} App#plugins
     * @since 1.0.0
     */
    this.plugins = enablePlugins;
  },

  /*
   * 读取 plugin.js 配置
   */
  readPluginConfigs(configPaths) {
    if (!Array.isArray(configPaths)) {
      configPaths = [ configPaths ];
    }

    const plugins = {};
    for (const configPath of configPaths) {
      if (!fs.existsSync(configPath)) {
        continue;
      }

      const config = interopRequire(configPath);

      for (const name in config) {
        this.normalizePluginConfig(config, name);
      }

      // 拷贝一个新对象，不修改原来的对象
      extendPlugins(plugins, config);
    }

    return plugins;
  },

  /*
   * 标准化每个插件的配置项
   */
  normalizePluginConfig(plugins, name) {
    const plugin = plugins[name];

    // 布尔型为简写，将其标准化
    // plugin_name: false
    if (typeof plugin === 'boolean') {
      plugins[ name ] = {
        name,
        enable: plugin,
        dep: [],
        env: [],
      };
      return;
    }

    // 否则标准化每个配置
    if (!('enable' in plugin)) {
      plugin.enable = true; // 如果没有配则默认开启
    }
    plugin.name = name;
    plugin.dep = plugin.dep || [];
    plugin.env = plugin.env || [];
    // path, package 不需要处理
  },

  // 读取插件本身的配置信息，插件只支持以下字段
  // {
  //   "name": "",    插件本身定义的名字，必须和配置名(应用或框架定义的 config/plugin.js)一致
  //   "dep": [],     插件申明的依赖
  //   "env": "",     插件适用的环境
  // }
  mergePluginConfig(plugin) {
    let pkg;
    let config;
    // 从 pkg.eggPlugin 获取配置
    const pluginPackage = path.join(plugin.path, 'package.json');
    if (fs.existsSync(pluginPackage)) {
      pkg = require(pluginPackage);
      config = pkg.eggPlugin;
      if (pkg.version) {
        plugin.version = pkg.version;
      }
    }

    const logger = this.options.logger;
    if (!config) {
      logger.warn(`[egg:loader] pkg.eggPlugin is missing in ${pluginPackage}`);
      return;
    }

    if (config.name && config.name !== plugin.name) {
      // pluginName 为 config/plugin.js 配置的插件名
      // pluginConfigName 为 pkg.eggPath.name
      logger.warn(`[egg:loader] pluginName(${plugin.name}) is different from pluginConfigName(${config.name})`);
    }

    for (const key of [ 'dep', 'env' ]) {
      if (!plugin[key].length && Array.isArray(config[key])) {
        plugin[key] = config[key];
      }
    }
  },

  /**
   * 获取所有已开启并排序后的插件列表
   * @param  {Object} allPlugins 所有的插件
   * @param  {Array} enabledPluginNames 插件列表
   * @return {Array} 插件列表
   * @private
   */
  getOrderPlugins(allPlugins, enabledPluginNames) {
    // 表示所有插件都未开启
    if (!enabledPluginNames.length) {
      return [];
    }

    const result = sequencify(allPlugins, enabledPluginNames);
    debug('Got plugins %j after sequencify', result);

    // 如果 result.sequence 是空数组可能处理有问题
    if (!result.sequence.length) {
      const err = new Error(`sequencify plugins has problem, missing: [${result.missingTasks}], recursive: [${result.recursiveDependencies}]`);
      // 找出缺少的 plugins 被谁依赖了
      for (const missName of result.missingTasks) {
        const requires = [];
        for (const name in allPlugins) {
          if (allPlugins[name].dep.indexOf(missName) >= 0) {
            requires.push(name);
          }
        }
        err.message += `\n\t>> Plugin [${missName}] is disabled or missed, but is required by [${requires}]`;
      }

      err.name = 'PluginSequencifyError';
      throw err;
    }

    // 打印被自动开启的插件
    const implicitEnabledPlugins = [];
    const requireMap = {};
    result.sequence.forEach(name => {
      // 统计插件被那些插件依赖，用于提示隐式开启的插件引用关系
      for (const depName of allPlugins[name].dep) {
        if (!requireMap[depName]) {
          requireMap[depName] = [];
        }
        requireMap[depName].push(name);
      }

      if (!allPlugins[name].enable) {
        // 如果计算结果未开启说明需要自动开启
        implicitEnabledPlugins.push(name);
        allPlugins[name].enable = true;
      }
    });
    if (implicitEnabledPlugins.length) {
      // Following plugins will be enabled implicitly.
      //   - configclient required by [hsfclient]
      //   - eagleeye required by [hsfclient]
      //   - diamond required by [hsfclient]
      this.options.logger.info(`Following plugins will be enabled implicitly.\n${implicitEnabledPlugins.map(name => `  - ${name} required by [${requireMap[name]}]`).join('\n')}`);
    }

    return result.sequence.map(name => allPlugins[name]);
  },

  // 获取插件真正的路径
  getPluginPath(plugin) {
    // 如果指定了 path 则直接使用
    if (plugin.path) {
      return plugin.path;
    }

    // 根据 package/name 配置
    const name = plugin.package || plugin.name;
    const lookupDirs = [];

    // 尝试在以下目录找到匹配的插件
    //  -> {appname}/node_modules
    //    -> {framework}/node_modules
    //      -> {framework}/lib/plugins (plugin.name)
    //        -> egg/node_modules
    //          -> egg/lib/plugins (plugin.name)
    //            -> $CWD/node_modules
    lookupDirs.push(path.join(this.options.baseDir, 'node_modules'));

    // 到 egg 中查找，优先从外往里查找
    for (let i = this.eggPaths.length - 1; i >= 0; i--) {
      const eggPath = this.eggPaths[i];
      lookupDirs.push(path.join(eggPath, 'node_modules'));
      lookupDirs.push(path.join(eggPath, 'lib/plugins'));
    }

    // npm@3, 插件测试用例，还需要通过 $cwd/node_modules 目录获取
    lookupDirs.push(path.join(process.cwd(), 'node_modules'));

    for (let dir of lookupDirs) {
      dir = path.join(dir, name);
      if (fs.existsSync(dir)) {
        return dir;
      }
    }

    throw new Error(`Can not find plugin ${name} in "${lookupDirs.join(', ')}"`);
  },

};

// 将 plugin 合并到 target 中
// 如果合并过程中，插件指定了 path/package，则将已存在的 path/package 删除。
function extendPlugins(target, plugins) {
  if (!plugins) {
    return;
  }
  for (const name in plugins) {
    const plugin = plugins[name];
    if (!target[name]) {
      target[name] = {};
    }
    if (plugin.path || plugin.package) {
      delete target[name].path;
      delete target[name].package;
    }
    for (const prop in plugin) {
      if (plugin[prop] === undefined) {
        continue;
      }
      if (target[name][prop] && Array.isArray(plugin[prop]) && !plugin[prop].length) {
        continue;
      }
      target[name][prop] = plugin[prop];
    }
  }
}
