'use strict';

module.exports = app => {
  app.get('/depth', function*() {
    this.body = {
      one: this.depth.one.get(),
      two: this.depth.two.two.get(),
      three: this.depth.three.three.three.get(),
      four: this.depth.four.four.four.four.get(),
    }
  });

  app.get('/type', function*() {
    this.body = {
      class: this.type.class.get(),
      functionClass: this.type.functionClass.get(),
      object: this.type.object.get(),
      generator: yield this.type.generator(),
      null: this.type.null,
      number: this.type.number,
    };
  });

  app.get('/service', function* () {
    this.body = {
      service1: this.service1.user.userInfo,
      service2: this.service2.user.userInfo,
    };
  });
};
