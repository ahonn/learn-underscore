var _ = require('underscore')._;

var obj = {
  "one" : 1,
  "two" : 2,
  "there" : 3
};

var that = function () {
  obj = [1, 2, 3];
};

// each
console.log("=== each ===");

_.each([1, 2, 3], function (ele) {
  console.log(ele);
});

_.each(obj, function (ele, idx) {
  console.log(idx + ":" + ele);
});

_.each([1, 2, 3], function (ele, idx, obj) {
  console.log(idx + ":" + (ele + obj[idx]));
}, that);


// map
console.log("=== map ===");

_.map([1, 2, 3], function (ele) {
  console.log(ele * 3);
});

var m = _.map(obj, function (ele, idx) {
  return ele + idx;
});
console.log(m);
