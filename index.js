/* globals log, __command, NSThread */

var util = require("util")
var prepareValue = require("./prepare-value")

var indentLevel = 0
function indentString(string) {
  var indent = ""
  for (var i = 0; i < indentLevel; i += 1) {
    indent += "  "
  }
  if (indentLevel > 0) {
    indent += "| "
  }

  return string.replace(/\n/g, indent + "\n")
}

function logEverywhere(level, payload, skipFormat) {
  var stringValue = skipFormat ? payload : util.format.apply(this, payload)

  log({
    stringValue: indentString(stringValue),
    payload: [prepareValue(payload)],
    level: level,
    command: __command
  })
}

if (!console._sketch) {
  var oldAssert = console.assert
  console.assert = function assert(condition, text) {
    // log to the JS context
    if (oldAssert) oldAssert.apply(this, arguments)

    if (!condition) {
      return logEverywhere("assert", [text])
    }
    return undefined
  }

  var oldClear = console.clear
  console.clear = function clear() {
    if (oldClear) oldClear.apply(this, arguments)

    var threadDictionary = NSThread.mainThread().threadDictionary()
    var panel = threadDictionary["skpm.debugger"]
    if (!panel) {
      return
    }

    var webview = panel.contentView().subviews()[0]
    if (!webview || !webview.evaluateJavaScript_completionHandler) {
      return
    }

    webview.evaluateJavaScript_completionHandler(
      'sketchBridge({"name":"logs/CLEAR_LOGS"});',
      null
    )
  }

  var counts = {}

  var oldCount = console.count
  console.count = function count(label) {
    // log to the JS context
    if (oldCount) oldCount.apply(this, arguments)

    label = typeof label !== "undefined" ? label : "default"
    counts[label] = (counts[label] || 0) + 1

    return logEverywhere("log", label + ": " + counts[label], true)
  }

  var oldCountReset = console.countReset
  console.countReset = function countReset(label) {
    // log to the JS context
    if (oldCountReset) oldCountReset.apply(this, arguments)

    label = typeof label !== "undefined" ? label : "default"
    counts[label] = 0
  }

  console.debug = console.log

  var oldDir = console.dir
  console.dir = function dir(obj, options) {
    // log to the JS context
    if (oldDir) oldDir.apply(this, arguments)

    options = options || {}
    options.customInspect = false
    return logEverywhere("log", util.inspect(obj, options), true)
  }

  var oldDirxml = console.dirxml
  console.dirxml = function dirxml() {
    // log to the JS context
    if (oldDirxml) oldDirxml.apply(this, arguments)

    return logEverywhere("log", Array.from(arguments))
  }

  var oldError = console.error
  console.error = function error() {
    // log to the JS context
    if (oldError) oldError.apply(this, arguments)
    return logEverywhere("error", Array.from(arguments))
  }

  var oldGroup = console.group
  console.group = function group() {
    // log to the JS context
    if (oldGroup) oldGroup.apply(this, arguments)

    if (arguments.length) {
      Array.from(arguments).forEach(function logItems(label) {
        logEverywhere("log", [label])
      })
    }
    indentLevel += 1
  }

  console.groupCollapsed = console.group

  var oldGroupEnd = console.groupEnd
  console.groupEnd = function groupEnd() {
    // log to the JS context
    if (oldGroupEnd) oldGroupEnd.apply(this, arguments)

    indentLevel -= 1
    if (indentLevel < 0) {
      indentLevel = 0
    }
  }

  var oldInfo = console.info
  console.info = function info() {
    // log to the JS context
    if (oldInfo) oldInfo.apply(this, arguments)

    return logEverywhere("info", Array.from(arguments))
  }

  var oldLog = console.log
  console.log = function log() {
    // log to the JS context
    if (oldLog) oldLog.apply(this, arguments)

    return logEverywhere("log", Array.from(arguments))
  }

  var timers = {}

  var oldTime = console.time
  console.time = function time(label) {
    // log to the JS context
    if (oldTime) oldTime.apply(this, arguments)

    label = typeof label !== "undefined" ? label : "default"
    if (timers[label]) {
      return logEverywhere("warn", 'Timer "' + label + '" already exists', true)
    }

    timers[label] = Date.now()
    return undefined
  }

  var oldTimeEnd = console.timeEnd
  console.timeEnd = function timeEnd(label) {
    // log to the JS context
    if (oldTimeEnd) oldTimeEnd.apply(this, arguments)

    label = typeof label !== "undefined" ? label : "default"
    if (!timers[label]) {
      return logEverywhere("warn", 'Timer "' + label + '" does not exist', true)
    }

    var duration = Date.now() - timers[label]
    delete timers[label]
    return logEverywhere("log", [label + ": " + duration + "ms"])
  }

  // console.trace = function() {}

  var oldWarn = console.warn
  console.warn = function warm() {
    // log to the JS context
    if (oldWarn) oldWarn.apply(this, arguments)

    return logEverywhere("warn", Array.from(arguments))
  }

  console._sketch = true
}

module.exports = function createConsole() {
  return console
}
