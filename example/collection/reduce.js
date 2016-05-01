var _ = require('underscore')._;

var arr = [1, 2, 3];

var obj = {
  "one" : 1,
  "two" : 2,
  "there" : 3
};

var r = _.reduce(arr, function (memo, num) {
  return memo + num;
}, 0);
console.log(r);

var r = _.reduce(obj, function (memo, num, key) {
  return memo + num + key;
}, 0);
console.log(r);
