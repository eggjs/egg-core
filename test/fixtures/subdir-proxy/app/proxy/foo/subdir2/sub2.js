'use strict';

const Service = require('../../../../../egg/service');

class Sub2 extends Service {
  constructor(ctx) {
    super(ctx);
  }

  * get(name) {
    return {
      name: name,
      bar: 'bar3',
    };
  }
}

module.exports = Sub2;
