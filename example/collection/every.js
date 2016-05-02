var _ = require('underscore')._;

var arr = [2, 3, 4, 5, 6];

var e = _.every(arr, function(num) {
  return num >= 2;
});
console.log(e);

var s = _.some(arr, function(num) {
  return num <= 3;
});
console.log(s);
