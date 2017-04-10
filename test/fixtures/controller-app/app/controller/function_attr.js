'use strict';

exports.getAccountInfo = function*() {
  const [name] = this.request.body || [];
  if (!name) {
    throw Error('please provide name');
  }
  this.body = 'your name is ' + name;
};

exports.getAccountInfo.operationType = true;

exports.foo = {
  bar: function*() {
    return 'account.foo.bar() is called!';
  },
};

exports.foo.bar.operationType = {
  value: 'account.foo.bar',
  name: 'account.foo.bar',
  desc: 'account.foo.bar',
  checkSign: true,
};
