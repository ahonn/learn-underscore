var _ = require('underscore')._;

var arr = [1, 2, 3];
var arr2 = [[2, 4, 3], [3, 2, 1]];

var c = _.contains(arr, 2);
console.log(c);

var c = _.contains(arr, 2, 2);
console.log(c);

var i = _.invoke(arr2, 'sort');
console.log(i);
