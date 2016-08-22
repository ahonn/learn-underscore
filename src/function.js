// Function (ahem) Functions
// 函数函数
// ------------------

// Determines whether to execute a function as a constructor
// or a normal function with the provided arguments
var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
  // 当 callingContext 不是 boundFunc 的实例
  if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
  var self = baseCreate(sourceFunc.prototype);
  var result = sourceFunc.apply(self, args);
  if (_.isObject(result)) return result;
  return self;
};

// Create a function bound to a given object (assigning `this`, and arguments,
// optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
// available.
// `bind` 函数。
// 绑定函数到指定对象上，可传入任意可选参数到 arguments。
_.bind = function(func, context) {
  // 原生支持 bind 函数时，优先使用原生 bind。
  // natvieBind: Function.prototype.bind
  if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));

  // 如果 func 不是一个函数，抛出异常
  if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
  var args = slice.call(arguments, 2);
  var bound = function() {
    return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
  };
  return bound;
};

// Partially apply a function by creating a version that has had some of its
// arguments pre-filled, without changing its dynamic `this` context. _ acts
// as a placeholder, allowing any combination of arguments to be pre-filled.
// `partial` 函数。
// 返回一个填充了部分参数的函数。
_.partial = function(func) {
  var boundArgs = slice.call(arguments, 1);
  var bound = function() {
    var position = 0, length = boundArgs.length;
    var args = Array(length);
    for (var i = 0; i < length; i++) {
      args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
    }
    while (position < arguments.length) args.push(arguments[position++]);
    return executeBound(func, bound, this, this, args);
  };
  return bound;
};

// Bind a number of an object's methods to that object. Remaining arguments
// are the method names to be bound. Useful for ensuring that all callbacks
// defined on an object belong to it.
_.bindAll = function(obj) {
  var i, length = arguments.length, key;
  if (length <= 1) throw new Error('bindAll must be passed function names');
  for (i = 1; i < length; i++) {
    key = arguments[i];
    obj[key] = _.bind(obj[key], obj);
  }
  return obj;
};

// Memoize an expensive function by storing its results.
// `memoize` 函数。
// 缓存函数计算结果。
_.memoize = function(func, hasher) {
  var memoize = function(key) {
    var cache = memoize.cache;
    var address = '' + (hasher ? hasher.apply(this, arguments) : key);
    if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
    return cache[address];
  };
  memoize.cache = {};
  return memoize;
};

// Delays a function for the given number of milliseconds, and then calls
// it with the arguments supplied.
// `delay` 函数。
// 延迟执行函数，wait 参数为延迟时间。
_.delay = function(func, wait) {
  // 获取函数的参数
  var args = slice.call(arguments, 2);
  // 返回 setTimeout
  return setTimeout(function(){
    return func.apply(null, args);
  }, wait);
};

// Defers a function, scheduling it to run after the current call stack has
// cleared.
// `defer` 函数。
// 延迟调用函数知道当前调用栈清空，类似使用延时为 0 的 setTimeout。
_.defer = _.partial(_.delay, _, 1);

// Returns a function, that, when invoked, will only be triggered at most once
// during a given window of time. Normally, the throttled function will run
// as much as it can, without ever going more than once per `wait` duration;
// but if you'd like to disable the execution on the leading edge, pass
// `{leading: false}`. To disable execution on the trailing edge, ditto.
// `throttle` 函数。
// 函数节流，间隔 wait 秒后才能触发。
// 参数 options 传入 {leading: false}，不会马上触发，在 wait 秒后触发第一次。
// 参数 options 传入 {trailing: false}，最后一次 func 不会触发。
_.throttle = function(func, wait, options) {
  var context, args, result;
  var timeout = null;
  var previous = 0;
  // 无 options 参数时，默认为空对象。
  if (!options) options = {};

  // 执行方法
  var later = function() {
    // options.leading 不为 false 时，previous 为当前时间。
    previous = options.leading === false ? 0 : _.now();
    timeout = null;
    result = func.apply(context, args);
    if (!timeout) context = args = null;
  };
  return function() {
    var now = _.now();
    if (!previous && options.leading === false) previous = now;
    var remaining = wait - (now - previous);
    context = this;
    args = arguments;

    // 到达间隔时间时触发
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining);
    }
    return result;
  };
};

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
// `debounce` 函数。
// 函数消抖，只触发一次。
_.debounce = function(func, wait, immediate) {
  var timeout, args, context, timestamp, result;

  var later = function() {
    var last = _.now() - timestamp;

    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      }
    }
  };

  return function() {
    context = this;
    args = arguments;
    timestamp = _.now();
    var callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }

    return result;
  };
};

// Returns the first function passed as an argument to the second,
// allowing you to adjust arguments, run code before and after, and
// conditionally execute the original function.
// `wrap` 函数。
// 将 func 函数封装到 wrapper 函数中。
_.wrap = function(func, wrapper) {
  return _.partial(wrapper, func);
};

// Returns a negated version of the passed-in predicate.
// 返回一个否定版本的 predicate 方法，返回值为原方法返回值取反。
_.negate = function(predicate) {
  return function() {
    return !predicate.apply(this, arguments);
  };
};

// Returns a function that is the composition of a list of functions, each
// consuming the return value of the function that follows.
// `compose` 函数。
// 返回函数集 functions 组合后的复合函数。
// 传入参数给最后一个函数，然后将函数的返回值当作参数传入倒数第二个函数，以此类推。
_.compose = function() {
  var args = arguments;
  // 获取最后一个函数的下标。
  var start = args.length - 1;
  return function() {
    var i = start;
    var result = args[start].apply(this, arguments);
    // 循环执行函数。
    while (i--) result = args[i].call(this, result);
    return result;
  };
};

// Returns a function that will only be executed on and after the Nth call.
// `after` 函数。
// 在运行了 times 次后才会有效果。
_.after = function(times, func) {
  return function() {
    if (--times < 1) {
      return func.apply(this, arguments);
    }
  };
};

// Returns a function that will only be executed up to (but not including) the Nth call.
// `before` 函数。
// 运行不超过 times 次时执行 func 函数，超过则返回最后一次有效调用的返回值。
_.before = function(times, func) {
  var memo;
  return function() {
    if (--times > 0) {
      memo = func.apply(this, arguments);
    }
    if (times <= 1) func = null;
    return memo;
  };
};

// Returns a function that will be executed at most one time, no matter how
// often you call it. Useful for lazy initialization.
// `once` 函数。
// 创建只调用一次的函数，通过为 `before` 函数指定 times 为 2 实现。
_.once = _.partial(_.before, 2);
