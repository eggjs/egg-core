'use strict';

//         a  <-  c
//   (opt)/      /
// b <-----------
//
// result: [ 'b', 'a', 'c' ]
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
