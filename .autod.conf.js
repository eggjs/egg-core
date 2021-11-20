'ues strict';

module.exports = {
  write: true,
  prefix: '^',
  devprefix: '^',
  exclude: [
    'test/fixtures',
  ],
  devdep: [
    'autod',
    'egg-bin',
    'egg-ci',
    'eslint',
    'eslint-config-egg',
  ],
  keep: [
    '@types/depd',
    '@types/koa',
  ],
  semver: [
    'globby@10',
  ],
};
