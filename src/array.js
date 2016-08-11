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