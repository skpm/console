var util = require("util")

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
  if (!options) {
    options = {}
  }
  if (!options.seen) {
    options.seen = []
  }
  var type
  var primitive
  if (util.isArray(value)) {
    type = Array.isArray(value) ? "Array" : util.getNativeClass(value)
    primitive = "Array"
    if (options.seen.indexOf(value) !== -1) {
      type = "Circular"
      value = []
    } else {
      options.seen.push(value)
      value = prepareArray(util.toArray(value), options)
    }
  } else if (util.isBoolean(value)) {
    type = typeof value === "boolean" ? "Boolean" : util.getNativeClass(value)
    primitive = "Boolean"
    value = Boolean(Number(value))
  } else if (util.isNullOrUndefined(value) || Number.isNaN(value)) {
    type = "Empty"
    primitive = "Empty"
    value = String(value)
  } else if (util.isNumber(value)) {
    type = typeof value === "number" ? "Number" : util.getNativeClass(value)
    primitive = "Number"
    value = Number(value)
  } else if (util.isString(value)) {
    type = typeof value === "string" ? "String" : util.getNativeClass(value)
    primitive = "String"
    value = String(value)
  } else if (util.getNativeClass(value) === 'MOStruct') {
    type = 'MOStruct'
    primitive = "Object"
    value = prepareObject(util.toObject(value), options)
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
    type = typeof value === "function" ? "Function" : util.getNativeClass(value)
    primitive = "Function"
    value =
      typeof value === "function" ? "[Function]" : util.getNativeClass(value)
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
    var nativeClass = util.getNativeClass(value)
    type = nativeClass || "Object"
    primitive = "Object"
    if (options.seen.indexOf(value) !== -1) {
      type = "Circular"
      value = {}
    } else if (value._isWrappedObject) {
      options.seen.push(value)
      type = value.type
      const propertyList = value.constructor._DefinedPropertiesKey
      const json = {}
      Object.keys(propertyList).forEach(function customToJSON(k) {
        if (!propertyList[k].exportable) {
          return
        }
        if (typeof value[k] === 'undefined') {
          return
        }
        json[k] = value[k]
        if (json[k] && !json[k]._isWrappedObject && json[k].toJSON) {
          json[k] = json[k].toJSON()
        }
      })
      value = prepareObject(json, options)
    } else {
      options.seen.push(value)
      value = prepareObject(util.toObject(value), options)
    }
  } else if (util.isNativeObject(value)) {
    type = util.getNativeClass(value)
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
