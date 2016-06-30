//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // 基本设置
  // --------------

  // 创建 root 对象，保存全局变量的引用。对应浏览器环境中的 window (self) 对象，
  // 服务器环境中的 global 对象，或者是其他虚拟机中的 this 对象。
  var root = typeof self == 'object' && self.self === self && self ||
            typeof global == 'object' && global.global === global && global ||
            this;

  // 保存原全局对象中的 _ 变量，此时的 _ 值为 undefined
  var previousUnderscore = root._;

  // 定义变量储存 Array 和 Object 的 prototype 属性，用于压缩代码
  var ArrayProto = Array.prototype, ObjProto = Object.prototype;
  // 如果是 ES6，支持 Symbol，则定义变量储存 Symbol.prototype
  var SymbolProto = typeof Symbol !== 'undefined' ? Symbol.prototype : null;

  // 定义变量，以快速访问核心类的原型方法
  var push = ArrayProto.push,
      slice = ArrayProto.slice,
      toString = ObjProto.toString,
      hasOwnProperty = ObjProto.hasOwnProperty;

  // 定义变量存储 ES5 实现的原生对象方法
  var nativeIsArray = Array.isArray,
      nativeKeys = Object.keys,
      nativeCreate = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // 创建安全的 underscore 对象的引用
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // 导出 undefined 对象，兼容 exports 和 module.exports
  if (typeof exports != 'undefined' && !exports.nodeType) {
    if (typeof module != 'undefined' && !module.nodeType && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // 定义版本号
  _.VERSION = '1.8.3';

  // 返回针对当前引擎优化的内部回调函数 optimize call back
  var optimizeCb = function(func, context, argCount) {
    // 没有上下文参数时，返回回调函数
    // void 0 的目的是为了返回 undefined，undefined 不是保留字，可以被覆盖
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
    // 不全部使用 apply 的原因是因为使用 call 编译器能够优化
    return function() {
      return func.apply(context, arguments);
    };
  };

  var builtinIteratee;

  // 产生回调函数,可以应用到集合中的每个元素,返回所需的结果
  var cb = function(value, context, argCount) {
    if (_.iteratee !== builtinIteratee) return _.iteratee(value, context);
    if (value == null) return _.identity; // 无回调时，返回一个返回自身的函数
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };

  // 回调函数的包装函数
  _.iteratee = builtinIteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // Similar to ES6's rest param (http://ariya.ofilabs.com/2013/03/es6-and-rest-parameter.html)
  // This accumulates the arguments passed into an array, after a given index.
  var restArgs = function(func, startIndex) {
    startIndex = startIndex == null ? func.length - 1 : +startIndex;
    return function() {
      var length = Math.max(arguments.length - startIndex, 0);
      var rest = Array(length);
      for (var index = 0; index < length; index++) {
        rest[index] = arguments[index + startIndex];
      }
      switch (startIndex) {
        case 0: return func.call(this, rest);
        case 1: return func.call(this, arguments[0], rest);
        case 2: return func.call(this, arguments[0], arguments[1], rest);
      }
      var args = Array(startIndex + 1);
      for (index = 0; index < startIndex; index++) {
        args[index] = arguments[index];
      }
      args[startIndex] = rest;
      return func.apply(this, args);
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  // 获取对象属性
  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // 用于判断迭代器迭代对象是数组还是对象
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  // 判断是否为数组，对象没有 length 属性
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };
