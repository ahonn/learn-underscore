var _ = require('underscore')._;

var arr = [1, 2, 3];

var obj = {
  "one" : 1,
  "two" : 2,
  "there" : 3
};

var that = function () {
  obj = [1, 2, 3];
};


_.each(arr, function (ele) {
  console.log(ele);
});

_.each(obj, function (ele, idx) {
  console.log(idx + ":" + ele);
});

_.each(arr, function (ele, idx, obj) {
  console.log(idx + ":" + (ele + obj[idx]));
}, that);
