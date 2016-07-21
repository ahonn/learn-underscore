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
    case 3: return function(value, index, collection) {
      return func.call(context, value, index, collection);
    };
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
