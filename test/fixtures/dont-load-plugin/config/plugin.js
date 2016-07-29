const path = require('path');

exports.testMe = {
  enable: true,
  env: ['local'],
  type: ['alipay'],
  path: path.join(__dirname, '../../../plugins/test-me')
};

exports.testMeAli = {
  enable: true,
  type: ['ali'],
  path: path.join(__dirname, '../../../plugins/test-me-ali')
};
