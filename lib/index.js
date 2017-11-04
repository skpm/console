/* globals log */
if (!console._skpmEnabled) {
  var sketchDebugger = require('@skpm/sketch-debugger/debugger')
  var actions = require('@skpm/sketch-debugger/shared-actions')

  function getStack() {
    return sketchDebugger.prepareStackTrace(new Error().stack)
  }

  function logEverywhere(type, args) {
    var values = Array.prototype.slice.call(args)

    // log to the System logs
    values.forEach(function(v) {
      try {
        log(indentString() + v)
      } catch (e) {
        log(v)
      }
    })

    if (!sketchDebugger.isDebuggerPresent()) {
      return
    }

    var payload = {
      ts: Date.now(),
      type: type,
      plugin: String(context.scriptPath),
      values: values.map(sketchDebugger.prepareValue),
      stack: getStack(),
    }

    sketchDebugger.sendToDebugger(actions.ADD_LOG, payload)
  }

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

  console.group = function() {
    // log to the JS context
    oldGroup && oldGroup.apply(this, arguments)
    indentLevel += 1
    sketchDebugger.sendToDebugger(actions.GROUP, {
      plugin: String(context.scriptPath),
      collapsed: false,
    })
  }

  var oldGroupCollapsed = console.groupCollapsed

  console.groupCollapsed = function() {
    // log to the JS context
    oldGroupCollapsed && oldGroupCollapsed.apply(this, arguments)
    indentLevel += 1
    sketchDebugger.sendToDebugger(actions.GROUP, {
      plugin: String(context.scriptPath),
    })
  }

  var oldGroupEnd = console.groupEnd

  console.groupEnd = function() {
    // log to the JS context
    oldGroupEnd && oldGroupEnd.apply(this, arguments)
    indentLevel -= 1
    if (indentLevel < 0) {
      indentLevel = 0
    }
    sketchDebugger.sendToDebugger(actions.GROUP_END, {
      plugin: context.scriptPath,
    })
  }

  var counts = {}
  var oldCount = console.count

  console.count = function(label) {
    label = typeof label !== 'undefined' ? label : 'Global'
    counts[label] = (counts[label] || 0) + 1

    // log to the JS context
    oldCount && oldCount.apply(this, arguments)
    return logEverywhere('log', [label + ': ' + counts[label]])
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

  var oldLog = console.log

  console.log = function() {
    // log to the JS context
    oldLog && oldLog.apply(this, arguments)
    return logEverywhere('log', arguments)
  }

  var oldWarn = console.warn

  console.warn = function() {
    // log to the JS context
    oldWarn && oldWarn.apply(this, arguments)
    return logEverywhere('warn', arguments)
  }

  var oldError = console.error

  console.error = function() {
    // log to the JS context
    oldError && oldError.apply(this, arguments)
    return logEverywhere('error', arguments)
  }

  var oldAssert = console.assert

  console.assert = function(condition, text) {
    // log to the JS context
    oldAssert && oldAssert.apply(this, arguments)
    if (!condition) {
      return logEverywhere('assert', [text])
    }
    return undefined
  }

  var oldInfo = console.info

  console.info = function() {
    // log to the JS context
    oldInfo && oldInfo.apply(this, arguments)
    return logEverywhere('info', arguments)
  }

  var oldClear = console.clear

  console.clear = function() {
    oldClear && oldClear()
    return sketchDebugger.sendToDebugger(actions.CLEAR_LOGS)
  }

  console._skpmEnabled = true

  // polyfill the global object
  var commonjsGlobal = typeof global !== 'undefined' ? global : this

  commonjsGlobal.console = console
}

module.exports = console
