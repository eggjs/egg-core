const { sleep } = require('../../utils');
module.exports = function (app) {
  app.beforeStart(function* () {
    yield sleep(11000);
    app.beforeStartFunction = true;
  });
  app.beforeStartFunction = false;
};

