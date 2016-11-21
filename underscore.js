//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // 基本配置
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  // 创建 root 对象，在浏览器中为 `window` 对象，在服务器（Node）下为 `exports` 对象。
  var root = this;

  // Save the previous value of the `_` variable.
  // 将全局环境中的 `_` 变量赋值给 previousUnderscore。
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  // 定义原型 protopype 属性的缓存变量，便于代码压缩。
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  // 定义原型对象方法的缓存变量，便于快速访问核心类的原型方法以及代码压缩。
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  // 定义 ES5 原生方法的缓存变量。如果浏览器支持，优先使用。
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  // 原型交换时使用的裸函数
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  // 为 _ 变量创建一个安全的引用
  var _ = function(obj) {
    // 若 obj 是 `_` 的实例，返回 obj
    if (obj instanceof _) return obj;
    // 若不是 `_` 的实例，返回实例化的对象
    if (!(this instanceof _)) return new _(obj);
    // 将 obj 赋值给 this._wrapped
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  // 将 `_` 导出至全局环境。即浏览器中的 window._ = _ ，服务器中的 expoets._ = _ 。
  // 并向后兼容 require() 的 API
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  // 当前版本号
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  // 针对当前引擎优化回调的内部函数 optimize call back
  var optimizeCb = function(func, context, argCount) {
    // 没有上下文参数 context 时，返回回调函数。
    // void 0 的目的是返回 undefined，因为 undefined 不是保留字，可能被重写。
    // void 会对给定的表达式求值并返回 undefined。
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };

      // 无指定参数个数时执行该 case
      // `_.each` 与 `_.map`
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };

      // `createReduce`
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    // 在参数个数能够确定且小于等于 4 时使用 call, 使得编译器能够优化。否则使用 apply。
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  // 生成可以应用到集合内每个元素的回调函数的内部函数。
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  // 创建分配器的内部函数
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  // 创建从另一个对象继承的新对象的内部函数
  var baseCreate = function(prototype) {
    // prototype 不是对象时返回一个空对象
    if (!_.isObject(prototype)) return {};

    // 如果浏览器支持 ES5 的 Object.create，使用其创建新对象
    if (nativeCreate) return nativeCreate(prototype);

    // 否则，使用裸函数保存 prototype，并实例新对象返回
    Ctor.prototype = prototype;
    var result = new Ctor;
    // 清空裸函数 prototype 属性
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  
  // 定义数组最大索引数常量
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;

  // 获取 Array or Array-like 元素的 length 属性值
  var getLength = property('length');

  // 判断是否为 Array-like 元素
  // Array-like 元素具有 Number 类型的 length 属性
  var isArrayLike = function(collection) {
    // 获取 collection 的 length 属性
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // 集合函数
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  // `each` 函数，亦称为 `forEach`。
  // 遍历集合中的每个元素，类数组使用索引迭代，对象使用键迭代。
  _.each = _.forEach = function(obj, iteratee, context) {
    // content !== undefined 时返回 iteratee.call(context, value, index, collection)。
    // 否则返回原 iteratee 函数。
    iteratee = optimizeCb(iteratee, context);
    var i, length;

    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      // 不为类数组时，获取对象的 key。
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  // `map` 函数，亦称为 `collect`。
  // 在集合的每个元素上执行 iteratee 方法，结果保存在数组中并返回。
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);

    // 不为类数组时，获取对象的 key。
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        // 创建与 Obj 长度相同的数组。
        results = Array(length);
    // 疑问：为什么上面的 `each` 函数不像 `map` 函数一样这样实现？
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  // 创建正序或者倒序迭代的函数。
  // 提供给 `reduce` 或者 `reduceRight` 使用。
  // dir == 1 正序
  // dir == -1 倒序
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    // 使用 arguments.length 优化迭代函数。
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        // 迭代操作，并返回提供下次迭代调用。
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          // 通过 dir 的值确定开始的索引位置。
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      // 没有 memo 值时，从第二个元素开始迭代。
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  // `reduce` 函数，亦称为 `foldl` 或 `inject`。
  // 正序处理集合中的每个元素，最终返回一个处理后的结果。
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  // `reduceRight` 函数，亦称为 `foldr`。
  // 倒序处理集合中的每个元素，最终返回一个处理后的结果。处理顺序与 `reduce` 函数相反。
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  // `find` 函数，亦称为 `detect`。
  // 寻找集合中第一个满足条件的元素，并返回该元素的值。
  _.find = _.detect = function(obj, predicate, context) {
    var key;

    // 寻找满足条件的元素的索引或键
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }

    // 若索引不为 -1 或者 键不为 undefined，即找到了满足条件的元素。
    // 找到则返回该元素的值，否则不返回（即函数返回 undefined）。
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  // `filter` 函数，亦称为 `select`。
  // 筛选集合中满足条件的元素，并返回结果集数组
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);

    // 遍历集合中的每个元素，满足条件则存入结果集中
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  // `reject` 函数。
  // 筛选集合中不满足条件的元素，并返回结果集数组，与 `filter` 函数相反。
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  // `every` 函数，亦称为 `all`。
  // 判断集合中的所有元素的值是否满足条件，全部满足返回 true，否则返回 false。
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);

    // 如果为对象则获取对象的键，否则等于 false。
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;

      // 如果有一个元素不满足条件，则返回 false。
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  // `some` 函数，亦称为 any。
  // 判断集合中是否有元素值符合条件，全部不满足返回 false，否则返回 true。
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;

      // 与 `every` 函数的区别就是这里。这里是只要有一个元素满足就返回 true。
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  // `contains` 函数，亦称为 `includes`。
  // 判断集合中是否包含某些项，返回布尔值。
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    // 如果集合为对象，则获取对象的 value 组成的数组。
    if (!isArrayLike(obj)) obj = _.values(obj);

    // fromIndex 为开始查找的位置参数，没有该参数则从 0 下标开始。
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;

    // 找到该值则返回 true。
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  // `invoke` 函数。
  // 在每个 obj 上执行指定的 method 方法，并返回结果集。（例如传入 "sort"）
  _.invoke = function(obj, method) {
    // 获取 method 之后传入的参数，这些参数将会传给 method。
    var args = slice.call(arguments, 2);

    // 判断传入的 method 是否是函数。
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      // 如果 method 不为函数，则获取对象对应的 method 属性
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  // `pluck` 函数。
  // 萃取集合中元素的某属性值，返回一个数组。
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  // `where` 函数。
  // 遍历集合，筛选包含指定的 attrs 键值对的元素，返回数组。
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  // `findWhere` 函数。
  // 遍历集合，返回包含指定 attrs 键值对的元素。
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  // `max` 函数。
  // 返回集合中元素的最大值，如果传递 iteratee 参数，iteratee 将作为集合中每个元素的排序依据。
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;

    // 如果没有传入 iteratee 参数并且集合不为空，则返回集合中的最大值。
    // 否则使用传入的排序依据，获取最大值。
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  // `min` 函数。
  // 返回集合中元素的最小值，如果传递 iteratee 参数，iteratee 将作为集合中每个元素的排序依据。
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  // `shuffle` 函数。
  // 随机打乱集合中的元素，返回乱序数组。
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  // `sample`对象。
  // 从集合中返回 n 个随机项，没有 n 参数时返回一个。
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  // `sortBy` 函数。
  // 返回一个排序后的集合副本，如果有 iteratee 参数，使用 iteratee 作为排序依据。
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    // pluck 获取 value 值得集合
    // map 处理集合为类数组，通过 iteratee 添加用于排序的 criteria
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      // 根据 criteria 从大到小排序
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  // `groupBy` 函数的内部函数
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  // `groupBy` 函数。
  // 通过 iteratee 结果分组，如果 iteratee 是字符串则通过该属性名称分组
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  // `indexBy` 函数。
  // 通过索引分组，键值对唯一
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  // `countBy` 函数。
  // 返回类似通过 groupBy 分组后计数，返回键与对于的值得数量
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  // `toArray` 函数。
  // 将集合转为数组。
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  // `size` 函数。
  // 返回集合的长度。
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  // partition 函数。
  // 分解集合为两个集合，一个为符合指定条件，另一个为不符合
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // 数组函数
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  // `first` 函数，亦称为 `head`, `take`。
  // 返回数组的第 n 个元素，当无 n 参数时，默认返回第一个元素。
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  // `initial` 函数。
  // 删除数组的后 n 个元素，当无 n 参数时，默认删除最后一个元素。
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  // `last` 函数。
  // 返回数组的后 n 个元素，当无 n 参数时，默认返回最后一个元素。
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  // `rest` 函数，，亦称为 `tail`, `drop`。
  // 删除数组中的前 n 个元素，当无 n 参数是，默认删除数组的第一个元素。
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  // `compact` 函数。
  // 返回一个新的数组，包含 array 中的所有非 false 项。
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  // `flatten` 函数的内部实现。
  // input 为需要展开的数组，shallow 为是否需要浅展开。
  // strict 为当 shallow 为 true 时，严格过滤数组中的非数组项。
  // output 为输出的数组。
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      // 检查 input 中的项是否为 数组 或者 arguments
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        // 如果为深展开，递归调用 flatten 函数
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        // 若该项非数组或 arguments, 且为不严格过滤展开，不做任何处理
        // 即严格过滤非数组项并且是深展开时，最后得到的 output 为空数组
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  // `flatten` 函数。
  // 展开数组，默认不过滤非数组项
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  // `without` 函数。
  // 返回一个删除某些特定项后的新数组。
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  // `uniq` 函数，亦称为 `unique`。
  // 对数组去重，并返回新数组。当 isSorted 为 true （即数组已排序）时会使用效率更高的算法。
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    // 当不传入 isSorted 参数时处理后面的参数
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        // 对已排序的数组，去当前项与前一项比较
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        // 传入 iteratee 时判断 seen 数组中否包含 computed
        // 否则判断 result 数组中是否存在 value
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  // `union` 函数。
  // 合并传入的数组并去重，返回一个新数组。
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  // `intersection` 函数。
  // 返回一个包含数组交集的新数组。
  _.intersection = function(array) {
    var result = [];
    // 获取传入的其他数组数量。
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      // 结果已经包含的项，则跳过。
      if (_.contains(result, item)) continue;
      // 如果有数组不包含该项，则跳过。
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      // 所有数组都拥有该项时，加入到结果数组中。
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  // `difference` 函数。
  // 返回一个不包含数组交集的新数组，即返回该数组中其他数组没有的项组成的数组。
  _.difference = function(array) {
    // 对传入的其他数组进行展开。
    var rest = flatten(arguments, true, true, 1);
    // 返回其他数组中不包含的项组成的新数组。
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  // `zip` 函数。
  // 将数组中对于位置的项合并为数组，并返回一个包含这些数组的数组。
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  // `unzip` 函数。
  // 将数组中的各个项按照对于的位置拆分为若干数组。
  _.unzip = function(array) {
    // 返回数组项中数组最大的长度。
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      // 获取每个项的 index 下标的值，并返回为数组给 result。
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  // `object` 函数。
  // 将数组转换为对象，传入键的 list 与 value 两个数组，或者传入键值对数组。
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        // 传入 list 与 value 时，将对于位置的项组成键值对。
        result[list[i]] = values[i];
      } else {
        // 没有传入 value 时，即传入的参数是项为键值对的数组。
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  // `findIndex` 与 `findLastIndex` 函数的生成器函数。
  // dir == 1 时为正序查找，-1 为倒序查找。
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        // 找到符合条件的第一个元素的下标并返回。
        if (predicate(array[index], index, array)) return index;
      }
      // 没有找到符合条件的元素时，返回 -1
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  // `findIndex` 与 `findLastIndex` 函数，找到第一个符合条件的元素的下标。
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  // `sortIndex` 函数。
  // 根据 iteratee 排序之后（如果有），查找 obj 插入后的下标位置。
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      // 二分查找
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  // `indexOf` 与 `lastIndexOf` 函数的生成器函数。
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    // idx 为 true 时启用二分查找，当 idx 为数字时，表示从第几位开始查找。
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      // 若 idx 为数字，处理搜索的起点。
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        // 二分查找该值。
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      // 如果 item 为 NaN, 查找值为 NaN 的元素下标。
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      // 否则遍历查找，没有查找到时返回 -1。
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  // `indexOf` 与 `lastIndexOf` 函数。
  // 返回元素在数组中的索引值，无该元素时返回 -1。
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  // `range` 函数，类似 Python 中的 range 函数。
  // 返回一定范围内特定步长的数组
  _.range = function(start, stop, step) {
    // 默认从 0 开始
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    // 步长默认为 1
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

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
  // 延迟调用函数直到当前调用栈清空，类似使用延时为 0 的 setTimeout。
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

  // Object Functions
  // 对象函数
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  // `toString` 被重写后，在 IE < 9 时会无法被 `for key in ...` 枚举。
  // 可以通过 {toString: null}.propertyIsEnumerable('toString') 判断是否为 IE < 9。
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');

  // 无法枚举的属性集合
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    // 获取对象的原型。
    // constructor 被重写时返回 Object.prototype，否则返回 obj.constructor.prototype。
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    // Constructor 是个特别的属性。
    var prop = 'constructor';
    // 如果 obj 中没有 constructor 属性，为 obj 添加。
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      // 如果 obj 有 prop 属性，且不是原型链上的属性，即重写了原型链上的属性。
      // 将 prop 属性加入到 keys 中。
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  // `keys` 函数。
  // 返回 obj 可枚举的所有属性组成的数组。
  _.keys = function(obj) {
    // 不是对象则返回空，即 obj 为数组时没有 key。
    if (!_.isObject(obj)) return [];
    // 优先使用本地方法 Object.key()。
    if (nativeKeys) return nativeKeys(obj);

    // 获取对象的键，组成数组。
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    // 添加在 IE < 9 时，重写的属性无法被 for ... in ... 枚举的 bug。
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  // `allKeys` 函数。
  // 返回 obj 拥有于继承的属性组成的数组。
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    // 与 `keys` 函数的区别是没有判断对象本身是否有这个键。
    // 即将从原型链继承的属性也添加到结果数组中。
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  // `values` 函数。
  // 返回由对象属性值组成的数组。
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  // `mapObject` 函数。
  // 与 `_.map` 函数类似，用于对象。
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  // `pairs` 函数。
  // 将对象转换为 [key, value] 组成的数组。
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  // `invert` 函数。
  // 返回一个键与值对换的新对象。
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  // `functions` 函数。
  // 获取对象中的方法名，并排序返回。
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      // 如果是属性值为函数，添加键名到 names 数组中。
      if (_.isFunction(obj[key])) names.push(key);
    }
    // 返回排序后的方法名数组。
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  // `extend` 函数。
  // 复制第二个参数对象中的所有属性覆盖到第一个对象上，并且返回这个对象。
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  // `extendOwn` 函数。
  // 与 `extend` 函数类似，但是不复制参数对象上继承的属性。
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  // `findKey` 函数。
  // 在 obj 中查找符合 predicate 条件的键。
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      // 满足条件返回键名
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  // `pick` 函数。
  // 返回只包含指定 key 的对象，过滤不需要的 key
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
   // 返回除去指定 key 的新对象
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  // 使用默认对象填充对象
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  // 创建具有给定原型的新对象
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  // 浅拷贝对象
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  // 返回对象中是否存在 attrs 键值对
  _.isMatch = function(object, attrs) {
    // 获取 attrs 中的键，以及 attrs 包含的键值对长度
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  // 内部函数，递归比较
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    // 0 === -0 返回 true，1/0 === 1/-0 返回 false
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    // null == undefined 返回 true，null === undefined 返回 false
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    // Object.prototype.toString
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      // /a/ === new RegExp('a') 返回 false，通过转换为字符串字面量去比较
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        // "5" === new String("5") 返回 false, 通过转换为字符串字面量去比较
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        // NaN !== NaN 返回 true，可以通过自身与自身比较来确认是否为 NaN
        // 在 underscore 中，NaN 与 NaN 比较需要返回 true
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        // Number() === -0 返回 true，与之前的处理相同，比较它们的倒数
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  // 判断是否为空
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  // 判断是否为 DOM 节点
  // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  // 判断是否为数组，首选使用原生 isArray 方法，否则对比 Object.prototype.toString() 返回值
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  // 判断是否为对象
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  // 添加某些类型判断函数，通过 Object.prototype.toString() 返回值 来判断
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  // 判断 Arguments 类型的兼容版本
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  // 适当的优化函数判断函数
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  // 判断是否为有限数字
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  // 判断是否为 NaN，NaN 与自身不相等
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  // 判断是否为布尔值
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  // 判断是否为 null
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  // 判断是否为 undefined
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  // `has` 函数。
  // 判断对象是否包含该键，hasOwnProperty 的引用。
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  // `now` 函数。
  // 获取当前时间戳
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));
