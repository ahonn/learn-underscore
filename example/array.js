var _ = require('../underscore.js')._;

var arr = [5, 4, 3, 2, 1];

var f = _.first(arr);
console.log(f);

var  i = _.initial(arr, 2);
console.log(i);

var l = _.last(arr);
console.log(l);

var r = _.rest(arr, 2);
console.log(r);
