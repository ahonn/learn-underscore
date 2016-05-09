var _ = require('../underscore.js')._;

var arr = [1, 2, 3];

var obj = {
  "one": 1,
  "two": 2,
  "there": 3
};

var e = _.each(arr, function (value, key) {
  console.log(key + value);
  return key + value;
});
console.log(e);

var m = _.map(arr, function (value, key) {
  console.log(key + value);
  return key + value;
});
console.log(m);

var r = _.reduce(arr, function (memo, value) {
  return memo + value;
}, 0);
console.log(r);

var r = _.reduceRight(obj, function (memo, value, key) {
  return memo + value + key;
}, '');
console.log(r);

var f = _.filter(arr, function (value) {
  return value % 2 == 0;
});
console.log(f);

var f = _.find(arr, function (value) {
  return value % 1 == 0;
});
console.log(f);

var r = _.reject(arr, function (value) {
  return value % 2 == 0;
});
console.log(r);

var e = _.every(arr, function (value) {
  return value > 0;
});
console.log(e);

var s = _.some(arr, function (value) {
  return value < 0;
});
console.log(s);

var c = _.contains(arr, 2, 2);
console.log(c);

var i = _.invoke([[3, 2, 1], [8, 2, 3]], 'sort');
console.log(i);

var stooges = [{name: 'moe', age: 40}, {name: 'larry', age: 40}, {name: 'curly', age: 60}];
var p = _.pluck(stooges, 'name');
console.log(p);

var w = _.where(stooges, {age: 40});
console.log(w);

var f = _.findWhere(stooges, {age: 40});
console.log(f);

var m = _.max(stooges, function (value) {
  return value.age;
});
console.log(m);

var m = _.min(stooges, function (value) {
  return value.age;
});
console.log(m);

var s = _.sample(arr);
console.log(s);

var s = _.sample(arr, 2);
console.log(s);

var s = _.sortBy(arr, function (num) {
  return Math.sin(num);
});
console.log(s);
