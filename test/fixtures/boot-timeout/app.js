const { sleep } = require('../../utils');

module.exports = class TimeoutHook {
  async didLoad() {
    await sleep(10);
  }
};
