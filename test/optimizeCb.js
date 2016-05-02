var Benchmark = require('benchmark');
var suite = new Benchmark.Suite;

var optimizeCb = function(func, context, argCount) {
  if (context === void 0) return func;
  switch (argCount == null ? 3 : argCount) {
    case 1: return function(value) {
      return func.call(context, value);
    };
    case 3: return function(value, index, collection) {
      return func.call(context, value, index, collection);
    };
    case 4: return function(accumulator, value, index, collection) {
      return func.call(context, accumulator, value, index, collection);
    };
  }
  return function() {
    return func.apply(context, arguments);
  };
};

var cb = function(func, context) {
  return function() {
    return func.apply(context, arguments);
  }
};

function sum(a, b, c) {
  return a + b + c;
}

suite
  .add('optimizeCb', function() {
    optimizeCb(sum, this)(24, 24, 24);
  })
  .add('cb', function() {
    cb(sum, this)(24, 24, 24);
  })
  .on('cycle', function(event) {
  console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run({ 'async': true });
