/* globals log */

if (!console.dump) {
  var indentLevel = 0
  function indentString() {
    var indent = ''
    for (var i = 0; i < indentLevel; i++) {
      indent += '  '
    }
    if (indentLevel > 0) {
      indent += '| '
    }
    return indent
  }

  var oldGroup = console.group

  console.group = function () {
    oldGroup.apply(this, arguments)
    indentLevel += 1
  }

  var oldGroupEnd = console.groupEnd

  console.groupEnd = function () {
    oldGroupEnd.apply(this, arguments)
    indentLevel -= 1
    if (indentLevel < 0) {
      indentLevel = 0
    }
  }

  var oldLog = console.log

  console.log = function (text) {
    oldLog.apply(this, arguments)
    return log(indentString() + text)
  }

  var oldWarn = console.warn

  console.warn = function (text) {
    oldWarn.apply(this, arguments)
    return log(indentString() + text)
  }

  var oldError = console.error

  console.error = function (text) {
    oldError.apply(this, arguments)
    return log(indentString() + text)
  }

  var oldAssert = console.assert

  console.assert = function (condition, text) {
    oldAssert.apply(this, arguments)
    if (!condition) {
      return log(indentString() + text)
    }
    return undefined
  }

  var oldInfo = console.info

  console.info = function (text) {
    oldInfo.apply(this, arguments)
    return log(indentString() + text)
  }

  console.dump = function (obj, options) {
    options = options || {}
    console.group()
    console.log('Dumping object ' + obj)

    if (obj.className) {
      console.log('Object class is: ' + obj.className())
    }

    if (obj.class && obj.class().mocha) {
      var name = obj.className()

      console.group()
      console.log(name + "'s properties:")
      console.log(obj.class().mocha().properties())
      console.groupEnd()

      if (options.withAncestors) {
        console.group()
        console.log(name + "'s properties with ancestors:")
        console.log(obj.class().mocha().propertiesWithAncestors())
        console.groupEnd()
      }

      console.group()
      console.log(name + "'s class methods:")
      console.log(obj.class().mocha().classMethods())
      console.groupEnd()

      if (options.withAncestors) {
        console.group()
        console.log(name + "'s class methods with ancestors:")
        console.log(obj.class().mocha().classMethodsWithAncestors())
        console.groupEnd()
      }

      console.group()
      console.log(name + "'s instance methods:")
      console.log(obj.class().mocha().instanceMethods())
      console.groupEnd()

      if (options.withAncestors) {
        console.group()
        console.log(name + "'s instance methods with ancestors:")
        console.log(obj.class().mocha().instanceMethodsWithAncestors())
        console.groupEnd()
      }

      console.group()
      console.log(name + "'s protocols:")
      console.log(obj.class().mocha().protocols())
      console.groupEnd()

      if (options.withAncestors) {
        console.group()
        console.log(name + "'s protocols with ancestors:")
        console.log(obj.class().mocha().protocolsWithAncestors())
        console.groupEnd()
      }
    }

    if (obj.treeAsDictionary) {
      console.group()
      console.log(name + "'s representation as a tree:")
      console.log(obj.treeAsDictionary())
      console.groupEnd()
    }

    console.groupEnd()
  }

  // polyfill the global object
  var commonjsGlobal = typeof global !== 'undefined'
  ? global
  : this

  commonjsGlobal.console = console
}

module.exports = console
