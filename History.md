
4.8.0 / 2018-05-22
==================

**features**
  * [[`bb24396`](http://github.com/eggjs/egg-core/commit/bb243964c98a633c6ccdfb5b0dc1f55a4d1ea301)] - feat: pick commit from 3.x (#166) (Haoliang Gao <<sakura9515@gmail.com>>)

**others**
  * [[`72d33ae`](http://github.com/eggjs/egg-core/commit/72d33ae10cf8ff9e8e640bf3aba028da5ca7b90a)] - test: add testcase for loadExtend with function call (#167) (Haoliang Gao <<sakura9515@gmail.com>>)

4.7.1 / 2018-04-25
==================

**fixes**
  * [[`4508c36`](http://github.com/eggjs/egg-core/commit/4508c364346ddf16a752e26bc7966216f9c09c10)] - fix: toAsyncFunction can't pass is.asyncFunction() (#159) (Khaidi Chu <<i@2333.moe>>)

4.7.0 / 2018-04-21
==================

  * feat: support ts by env (#158)

4.6.0 / 2018-04-09
==================

**features**
  * [[`7f087e7`](http://github.com/eggjs/egg-core/commit/7f087e7d30bf9b07249b44fb943bcc9d109f26f6)] - feat: change assert to warning (#157) (Axes <<whxaxes@qq.com>>)

4.5.0 / 2018-03-25
==================

**features**
  * [[`2c6fbbf`](http://github.com/eggjs/egg-core/commit/2c6fbbf10c34420d623282312b555eecaaf3a755)] - feat: loader support custom extension (#156) (Axes <<whxaxes@qq.com>>)

4.4.1 / 2018-03-09
==================

**fixes**
  * [[`046ffdd`](http://github.com/eggjs/egg-core/commit/046ffdd5d4b918ddfc0e9f7980567374b594ef97)] - fix: should not load optional plugin & their deps (#154) (zōng yǔ <<gxcsoccer@users.noreply.github.com>>)

4.4.0 / 2018-01-18
==================

**features**
  * [[`5323a9e`](git@github.com:eggjs/egg-core/commit/5323a9ec54d60a43aed06cfd67c617d02909715d)] - feat: add patch method for update (egg#1793) (#150) (吴建金 <<mosaic101@foxmail.com>>)

4.3.2 / 2018-01-13
==================

**fixes**
  * [[`2926058`](git@github.com:eggjs/egg-core/commit/29260580b387ba6657c76a7881f60c4ce44c295c)] - fix: mutli-path register. (#151) (SuperEVO <<zhang740@qq.com>>)

4.3.1 / 2018-01-12
==================

**fixes**
  * [[`b41891d`](http://github.com/eggjs/egg-core/commit/b41891d160cd8be6e2df58b8540376b4ca6c76b8)] - fix: fix plugin sequence bug (#152) (zōng yǔ <<gxcsoccer@users.noreply.github.com>>)
  * [[`4f1c19a`](http://github.com/eggjs/egg-core/commit/4f1c19af711e4fe8cf65a2f0f01acdf5f276188b)] - fix: only filter the plugin which is disabled by app (#145) (#146) (Haoliang Gao <<sakura9515@gmail.com>>)

**others**
  * [[`3384a87`](http://github.com/eggjs/egg-core/commit/3384a8796d878536e8144671c42f5872c3d0e3a9)] - refactor: replace `indexOf()` with `includes()` (#148) (m31271n <<m31271n@2players.studio>>)
  * [[`613f236`](http://github.com/eggjs/egg-core/commit/613f236fba69f55ca27911d29d81a918c8d67c18)] - docs: fix typo (#147) (m31271n <<m31271n@2players.studio>>)
  * [[`25b728c`](http://github.com/eggjs/egg-core/commit/25b728c41fdf941c97f23a2675b8b82443f28938)] - refactor: warning when the plugin disabled by app is enabled implicitly (#141) (Haoliang Gao <<sakura9515@gmail.com>>)

4.3.0 / 2017-12-13
==================

**features**
  * [[`cbcf402`](http://github.com/eggjs/egg-core/commit/cbcf4028055a570c81b26dd39cadcfc548ffefd4)] - feat: support options.serverScope for egg-mock (#143) (Yiyu He <<dead_horse@qq.com>>)

4.2.2 / 2017-12-12
==================

**fixes**
  * [[`b327145`](git@github.com:eggjs/egg-core/commit/b327145d2c6f1328a5d0117186fef218c4b673a7)] - fix: should load router middleware in beforeStart (#139) (Yiyu He <<dead_horse@qq.com>>)
  * [[`187fdec`](git@github.com:eggjs/egg-core/commit/187fdec6c63c22c73716741934771eefb54320a8)] - fix: check whether controller exists (#138) (TZ | 天猪 <<atian25@qq.com>>)

4.2.1 / 2017-12-01
==================

**fixes**
  * [[`035098c`](http://github.com/eggjs/egg-core/commit/035098cfca5b20c05a8dde719f0e3995037b9a04)] - fix: adjust implicitly enable logic (#135) (zōng yǔ <<gxcsoccer@users.noreply.github.com>>)

4.2.0 / 2017-11-29
==================

**features**
  * [[`4979b98`](http://github.com/eggjs/egg-core/commit/4979b984e12cd39516ed1c6df5f1284c8faede2f)] - feat: export controller function's FULLPATH (#131) (#132) (fengmk2 <<fengmk2@gmail.com>>)

4.1.0 / 2017-11-20
==================

**features**
  * [[`4bb7472`](git@github.com:eggjs/egg-core/commit/4bb7472b1c2365e5b44d5f7c7f7050cb5915aa75)] - feat: export egg utils (#130) (Yiyu He <<dead_horse@qq.com>>)

**others**
  * [[`a02df89`](git@github.com:eggjs/egg-core/commit/a02df8958f040dc1796dffb0094f535c5c3936e9)] - test: use async function instead of generator function (#128) (Yiyu He <<dead_horse@qq.com>>)

4.0.0 / 2017-11-08
==================

**others**
  * [[`ba0c9b9`](git@github.com:eggjs/egg-core/commit/ba0c9b9e44c57333485e5424b81f047249232232)] - refactor: upgrade to koa@2 and koa-router@7 [BREAKING_CHANGE] (#125) (Yiyu He <<dead_horse@qq.com>>)

3.18.0 / 2017-11-08
==================

**features**
  * [[`c944f79`](git@github.com:eggjs/egg-core/commit/c944f79cf9c4ec160bb56d97b41fc7d7e2c8d27c)] - feat: export app.options (#127) (Haoliang Gao <<sakura9515@gmail.com>>)

3.17.0 / 2017-11-07
==================

**features**
  * [[`08b498f`](git@github.com:eggjs/egg-core/commit/08b498f76ff259ee049c20eb1933c5a294179cc8)] - feat: toAsyncFunction compact with async function (#126) (Yiyu He <<dead_horse@qq.com>>)

3.16.0 / 2017-11-06
==================

**features**
  * [[`f9b4ae8`](git@github.com:eggjs/egg-core/commit/f9b4ae89b9d0b51a042fe7f80ab0cee184f30445)] - feat: add toPromise and toAsyncFunction (#124) (Yiyu He <<dead_horse@qq.com>>)

3.15.1 / 2017-10-29
==================

**others**
  * [[`1eaa0c6`](http://github.com/eggjs/egg-core/commit/1eaa0c689aabd650955d0150228d3bd2a3dd8aa9)] - refactor: use utility to read json (#122) (Haoliang Gao <<sakura9515@gmail.com>>)

3.15.0 / 2017-10-20
==================

**features**
  * [[`eedfd3d`](http://github.com/eggjs/egg-core/commit/eedfd3d4517f1931f541d0201c3f7d1c2fbf85a3)] - feat: support serverScope (#120) (Haoliang Gao <<sakura9515@gmail.com>>)

3.14.0 / 2017-10-17
==================

**features**
  * [[`c2dec90`](http://github.com/eggjs/egg-core/commit/c2dec90b0f942384f62c432d61f4917c55652fd4)] - feat(core): adding support to register inherited methods when loading controllers (#119) (lkspc <<lkspc@qq.com>>)

3.13.1 / 2017-09-01
===================

  * fix: TypeError when DEBUG=* (#112)

3.13.0 / 2017-07-24
===================

  * feat: controller support params by config (#110)
  * style: spelling mistakes，orginal -> original (#109)

3.12.2 / 2017-07-11
===================

  * fix: check loader existing before retrieve properties (#108)

3.12.1 / 2017-07-05
==================

  * fix: should ignore Object.getPrototypeOf check on null/undefined (#107)

3.12.0 / 2017-07-05
===================

  * feat: generate configMeta (#106)
  * deps: upgrade eslint (#104)
  * docs: fix typo (#103)
  * deps: upgrade dependencies (#102)
  * refactor(plugin): ignore loop when push plugin.default.js (#101)

3.11.0 / 2017-06-21
==================

  * feat: framework can override getExtendFilePaths (#100)

3.10.0 / 2017-06-08
===================

  * chore: improve cov (#91)
  * feat: support app.middleware[name] (#98)
  * test: add node 8 (#97)

3.9.0 / 2017-05-31
==================

  * feat: app timeout support config by env (#94)
  * fix: load class controller should skip getter & setter (#96)
  * refactor: use template literals in lib/utils/index.js (#95)

3.8.0 / 2017-05-20
==================

  * feat: support load custom file type (#93)
  * chore(documentation): fix typo (#92)
  * test: fix the testcase that is skipped (#89)
  * refactor: change private function name to Symbol from being called outside. (#87)
  * test: skip the failed testcase (#88)
  * refactor: use es6 rest parameter. (#84)

3.7.0 / 2017-05-03
==================

  * feat(file_loader): support filter options (#86)
  * feat: support custom directory (#85)
  * refact: use es6 default parameter value synax. (#83)

3.6.0 / 2017-05-02
==================

  * feat: add fullPath property on class instance (#82)

3.5.0 / 2017-04-26
==================

  * feat(file_loader): ignore option support array in FileLoader (#81)
  * fix: wrong optional dependencies in complex demo (#80)

3.4.1 / 2017-04-21
==================

  * fix: should support module.exports = function*(ctx) {} as a controller (#79)

3.4.0 / 2017-04-18
==================

  * refactor: export getHomedir that can be extended (#78)
  * feat: expose eggPlugins (#77)

3.3.1 / 2017-04-17
==================

  * fix: optionally depend on a plugin which is disabled. (#76)

3.3.0 / 2017-04-15
==================

  * feat: always load extend/xx.unittest.js when run test (#75)

3.2.2 / 2017-04-14
==================

  * fix: don't replace plugin.default.js when serverEnv is default (#74)

3.2.1 / 2017-04-13
==================

  * fix: allow extend setter or getter alone (#73)

3.2.0 / 2017-04-11
==================

  * test: add testcase for appPlugins and customPlugins (#72)
  * fix: find the true callee bebind proxy (#70)
  * feat:expose appPlugins & customPlugins (#68)
  * feat: expose BaseContextClass (#71)

3.1.0 / 2017-04-10
==================

  * feat: to keep controller function attributes (#69)

3.0.1 / 2017-04-10
==================

  * fix: ensure deprecate display the right call stack (#67)

3.0.0 / 2017-03-07
==================

  * feat: [BREAKING_CHANGE] array will be overridden when load config (#64)

2.2.0 / 2017-02-27
==================

  * fix: improve getPathName (#62)
  * feat: FileLoader support caseStyle (#59)
  * fix: improve require es module (#61)

2.1.1 / 2017-02-17
==================

  * fix: define egg.Service and egg.Controller in constructor (#58)

2.1.0 / 2017-02-15
==================

  * feat: load plugin.default.js rather than plugin.js (#57)
  * refactor: seperate router api from app (#55)

2.0.1 / 2017-02-15
==================

  * fix: context loader cache independent in each request (#54)

2.0.0 / 2017-02-10
==================

  * feat: [BREAKING_CHANGE] can get error from .ready() (#53)
  * fix: make sure close once (#51)
  * feat: imporve error message of async controller (#52)
  * deps: remove unuse devDeps (#49)
  * feat: [BREAKING_CHANGE] all middleware support async function and common function (#50)

1.8.0 / 2017-02-06
==================

  * feat: app.beforeStart support async function same as beforeClose (#48)
  * test: fix test on windows (#47)
  * feat: add this.service in BaseContextClass (#46)
  * feat: add this.config in BaseContextClass (#44)
  * fix: execute beforeClose hooks in reverse order (#45)

1.7.0 / 2017-01-26
==================

  * feat: add app.beforeClose to register close function (#43)

1.6.0 / 2017-01-20
==================

  * feat: controller support class (#42)

1.5.1 / 2017-01-19
==================

  * fix: don't assert config.proxy (#41)

1.5.0 / 2017-01-17
==================

  * feat: plugin support optionalDependencies (#40)

1.4.0 / 2017-01-12
==================

  * refactor: support config/env instead of config/serverEnv (#37)
  * fix(router): support app.get(url, controllerName) (#38)
  * feat: support app.beforeStart (#39)

1.3.3 / 2016-12-28
==================

  * test: use assert instead of should
  * refactor: warn only for redefine the same package

1.3.2 / 2016-12-08
==================

  * fix: distinguish property cache (#35)

1.3.1 / 2016-12-03
==================

  * fix: router.url can't parse multi params right (#34)

1.3.0 / 2016-11-25
==================

  * feat: make app middlewares also support enable (#33)

1.2.0 / 2016-11-21
==================

  * refactor: don't use core middleware when enable = false (#32)
  * feat: core middlewares support enable/match/ignore options (#31)

1.1.0 / 2016-11-09
==================

  * refactor: extract getAppInfo that can be extend (#30)

1.0.1 / 2016-11-07
==================

  * chore: add pkg.files (#29)

1.0.0 / 2016-11-04
==================

  * feat: warn when redefine plugin (#28)
  * refactor: assert eggPath should be string

0.6.0 / 2016-10-28
==================

  * feat: app support export generator (#26)

0.5.0 / 2016-10-24
==================

  * feat: app.js/agent.js support async function (#18)
  * feat: add EGG_HOME to getHomedir for test (#25)

0.4.0 / 2016-10-24
==================

  * feat: support plugin.{env}.js (#20)
  * feat: support {env}.js when load extend (#21)
  * feat: app.close return a promise (#19)
  * feat: [BREAKING_CHANGE] env as prod when EGG_SERVER_ENV undefined & NODE_ENV prod (#24)
  * feat: warning when missing EGG_SERVER_ENV at production (#23)
  * test: fix homedir testcase on Windows (#22)

0.3.0 / 2016-10-13
==================

  * fix: always get the executor's homedir (#17)
  * doc: Plugable > Pluggable (#16)
  * test: delete type testcase (#15)
  * fix: can't get appConfig in appConfig (#14)
  * feat: add plugin.from where declare the plugin (#13)
  * feat: [BREAKING_CHANGE] remove compatible support loadExtend (#12)

0.2.1 / 2016-08-18
==================

  * fix: resolve the realpath of plugin path (#11)

0.2.0 / 2016-08-17
==================

  * feat: improve initializer && export Loader

0.1.0 / 2016-08-16
==================

  * feat: rename egg-loader to egg-core (#8)
  * refactor: rename to egg-core (#6)
  * doc: proofread readme documentation and correct english terms (#7)
  * refactor API (#5)
  * refactor: implement Loader instead of loading (#4)

0.0.3 / 2016-07-30
==================

  * test: add testcase (#3)
  * fix: don't print middleware options on start log (#2)

0.0.2 / 2016-07-16
==================

  * first version
