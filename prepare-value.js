var util = require("util")
// var prepareStackTrace = require("./prepare-stack-trace")

var getNativeClass = util.getNativeClass
var isNativeObject = util.isNativeObject

function prepareArray(array, options) {
  return array.map(function prepareItem(i) {
    return prepareValue(i, options) // eslint-disable-line no-use-before-define
  })
}

function prepareObject(object, options) {
  if (!object) {
    return {}
  }
  const deep = {}
  Object.keys(object).forEach(function prepareItem(key) {
    deep[key] = prepareValue(object[key], options) // eslint-disable-line no-use-before-define
  })
  return deep
}

function prepareValue(value, options) {
  var type
  var primitive
  if (util.isArray(value)) {
    type = Array.isArray(value) ? "Array" : String(value.class())
    primitive = "Array"
    value = prepareArray(util.toArray(value), options)
  } else if (util.isBoolean(value)) {
    type = typeof value === "boolean" ? "Boolean" : String(value.class())
    primitive = "Boolean"
    value = Boolean(Number(value))
  } else if (util.isNullOrUndefined(value) || Number.isNaN(value)) {
    type = "Empty"
    primitive = "Empty"
    value = String(value)
  } else if (util.isNumber(value)) {
    type = typeof value === "number" ? "Number" : String(value.class())
    primitive = "Number"
    value = Number(value)
  } else if (util.isString(value)) {
    type = typeof value === "string" ? "String" : String(value.class())
    primitive = "String"
    value = String(value)
  } else if (util.isSymbol(value)) {
    type = "Symbol"
    primitive = "Symbol"
    value = util.inspect(value)
  } else if (util.isRegExp(value)) {
    type = "RegExp"
    primitive = "RegExp"
    value = util.inspect(value)
  } else if (util.isDate(value)) {
    type = "Date"
    primitive = "Date"
    value = util.inspect(value)
  } else if (util.isFunction(value)) {
    type = typeof value === "function" ? "Function" : String(value.class())
    primitive = "Function"
    value = typeof value === "function" ? "[Function]" : String(value.class())
  } else if (util.isBuffer(value)) {
    type = "Buffer"
    primitive = "Buffer"
    value = String(value)
  } else if (util.isError(value)) {
    type = "Error"
    primitive = "Error"
    value = {
      message: value.message,
      name: value.name,
      stack: value.stack,
      nativeException: prepareValue(value.nativeException, options)
    }
  } else if (util.isObject(value)) {
    var nativeClass = getNativeClass(value)
    type = nativeClass || "Object"
    primitive = "Object"
    value = prepareObject(util.toObject(value), options)
  } else if (isNativeObject(value)) {
    type = getNativeClass(value)
    // special case for NSException
    if (type === "NSException") {
      primitive = "Error"
      var stack = ""
      var userInfo = value.userInfo && value.userInfo() ? value.userInfo() : {}
      if (userInfo.stack) {
        stack = String(userInfo.stack)
      }
      value = {
        message: String(value.reason()),
        name: String(value.name()),
        stack: stack,
        userInfo: prepareObject(util.toObject(userInfo), options)
      }
    } else if (value.class().mocha) {
      primitive = "Mocha"
      value = type
    } else {
      primitive = "Unknown"
      value = type
    }
  } else {
    type = "Unknown"
    primitive = "Unknown"
    value = type
  }

  return {
    value: value,
    type: type,
    primitive: primitive
  }
}

module.exports = prepareValue
module.exports.prepareObject = prepareObject
module.exports.prepareArray = prepareArray
