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