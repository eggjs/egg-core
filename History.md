
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
