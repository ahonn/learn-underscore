var _ = require('underscore')._;

var arr = [1, 2, 3];

var obj = {
  "one" : 1,
  "two" : 2,
  "there" : 3
};

_.map(arr, function (ele) {
  console.log(ele * 3);
});

var m = _.map(obj, function (ele, idx) {
  return ele + idx;
}, this);
console.log(m);
