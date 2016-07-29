'use strict';

const Service = require('../../../egg/service');

class OK extends Service {
  constructor(ctx) {
    super(ctx);
  }

  * get() {
    return {
      ok: true,
    };
  }
}

module.exports = OK;
