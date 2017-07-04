'use strict';

//         a  <-  c
//   (opt)/      /
// b <-----------
//
// result: c > a > b
module.exports = {
  a: {
    enable: false,
    package: 'a',
  },
  b: {
    enable: false,
    package: 'b',
  },
  c: {
    enable: true,
    package: 'c',
  },
};
