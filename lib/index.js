/* globals log */

var util = require('util')

var indentLevel = 0
function indentString(string) {
  var indent = ''
  for (var i = 0; i < indentLevel; i++) {
    indent += '  '
  }
  if (indentLevel > 0) {
    indent += '| '
  }

  return string.replace(/\n/g, indent + '\n')
}

function logEverywhere(level, payload) {
  var stringValue = util.format.apply(this, payload)

  log({
    stringValue: indentString(stringValue),
    payload: payload,
    level: level,
    command: __command
  })
}

if (!console._sketch) {
  var oldAssert = console.assert
  console.assert = function(condition, text) {
    // log to the JS context
    oldAssert && oldAssert.apply(this, arguments)
    if (!condition) {
      return logEverywhere('assert', [text])
    }
    return undefined
  }

  // console.clear = function() {}

  var counts = {}

  var oldCount = console.count
  console.count = function(label) {
    // log to the JS context
    oldCount && oldCount.apply(this, arguments)

    label = typeof label !== 'undefined' ? label : 'default'
    counts[label] = (counts[label] || 0) + 1

    return logEverywhere('log', [label + ': ' + counts[label]])
  }

  var oldCountReset = console.countReset
  console.countReset = function(label) {
    // log to the JS context
    oldCountReset && oldCountReset.apply(this, arguments)

    label = typeof label !== 'undefined' ? label : 'default'
    counts[label] = 0
  }

  console.debug = console.log

  var oldDir = console.dir
  console.dir = function(obj, options) {
    // log to the JS context
    oldDir && oldDir.apply(this, arguments)

    options = options || {}
    options.customInspect = false
    return logEverywhere('log', util.inspect(obj, options))
  }

  var oldDirxml = console.dirxml
  console.dirxml = function () {
    // log to the JS context
    oldDirxml && oldDirxml.apply(this, arguments)

    return logEverywhere('log', Array.from(arguments))
  }

  var oldError = console.error
  console.error = function() {
    // log to the JS context
    oldDir && oldDir.apply(this, arguments)
    return logEverywhere('error', Array.from(arguments))
  }

  var oldGroup = console.group
  console.group = function() {
    // log to the JS context
    oldGroup && oldGroup.apply(this, arguments)

    if (arguments.length) {
      Array.from(arguments).forEach(function (label) {
        logEverywhere('log', [label])
      })
    }
    indentLevel += 1
  }

  console.groupCollapsed = console.group

  var oldGroupEnd = console.groupEnd
  console.groupEnd = function() {
    // log to the JS context
    oldGroupEnd && oldGroupEnd.apply(this, arguments)

    indentLevel -= 1
    if (indentLevel < 0) {
      indentLevel = 0
    }
  }

  var oldInfo = console.info
  console.info = function() {
    // log to the JS context
    oldInfo && oldInfo.apply(this, arguments)

    return logEverywhere('info', Array.from(arguments))
  }

  var oldLog = console.log
  console.log = function() {
    // log to the JS context
    oldLog && oldLog.apply(this, arguments)

    return logEverywhere('log', Array.from(arguments))
  }

  var timers = {}

  var oldTime = console.time
  console.time = function(label) {
    // log to the JS context
    oldTime && oldTime.apply(this, arguments)

    label = typeof label !== 'undefined' ? label : 'default'
    if (timers[label]) {
      return logEverywhere('warn', ['Timer "' + label + '" already exists'])
    }

    timers[label] = Date.now()
    return
  }

  var oldTimeEnd = console.timeEnd
  console.timeEnd = function(label) {
    // log to the JS context
    oldTimeEnd && oldTimeEnd.apply(this, arguments)

    label = typeof label !== 'undefined' ? label : 'default'
    if (!timers[label]) {
      return logEverywhere('warn', ['Timer "' + label + '" does not exist'])
    }

    var duration = Date.now() - timers[label]
    delete timers[label]
    return logEverywhere('log', [label + ': ' + (duration / 1000) + 'ms'])
  }

  // console.trace = function() {}

  var oldWarn = console.warn
  console.warn = function() {
    // log to the JS context
    oldWarn && oldWarn.apply(this, arguments)

    return logEverywhere('warn', Array.from(arguments))
  }

  console._sketch = true
}

module.exports = function () {
  return console
}
