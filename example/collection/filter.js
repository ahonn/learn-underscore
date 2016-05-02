var _ = require('underscore')._;

var arr = [1, 2, 3, 4, 5, 6];

var f = _.filter(arr, function (num) {
  return num % 2 == 0;
});
console.log(f);

var f = _.find(arr, function (num) {
  return num % 2 == 0;
});
console.log(f);

var r = _.reject(arr, function (num) {
  return num % 3 == 0;
});
console.log(r);
