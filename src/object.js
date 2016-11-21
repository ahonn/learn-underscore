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