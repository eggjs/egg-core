"use strict";
exports.__esModule = true;
exports["default"] = {
  fn() {
    return new Promise((res) => {
      setTimeout(() => {
        res({
          clients: 'Test Config'
        });
      }, 500);
    });
  },
};
