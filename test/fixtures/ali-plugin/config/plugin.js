const path = require('path');

exports.foo = {
  enable: true,
  type: ['ali'],
  path: path.join(__dirname, '../../../plugins/test-me')
};

exports.fooalipay = {
  enable: true,
  type: ['alipay'],
  path: path.join(__dirname, '../../../plugins/test-me2')
};
