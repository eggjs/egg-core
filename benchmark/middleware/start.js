'use strict';

const EggApplication = require('../../test/fixtures/egg');

const app = new EggApplication({
  baseDir: __dirname,
  type: 'application',
});

app.loader.loadAll();

app.listen(7001);
console.log('server started at 7001');
