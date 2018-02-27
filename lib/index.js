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

module.exports = function () {
  var console = {}

  console.assert = function(condition, text) {
    if (!condition) {
      return logEverywhere('assert', [text])
    }
    return undefined
  }

  console.clear = function() {}

  var counts = {}

  console.count = function(label) {
    label = typeof label !== 'undefined' ? label : 'default'
    counts[label] = (counts[label] || 0) + 1

    return logEverywhere('log', [label + ': ' + counts[label]])
  }

  console.countReset = function(label) {
    label = typeof label !== 'undefined' ? label : 'default'
    counts[label] = 0
  }

  console.debug = console.log

  console.dir = function(obj, options) {
    options = options || {}
    options.customInspect = false
    return logEverywhere('log', util.inspect(obj, options))
  }

  console.dirxml = console.log

  console.error = function() {
    return logEverywhere('error', Array.from(arguments))
  }

  console.group = function() {
    if (arguments.length) {
      Array.from(arguments).forEach(function (label) {
        logEverywhere('log', [label])
      })
    }
    indentLevel += 1
  }

  console.groupCollapsed = console.group

  console.groupEnd = function() {
    indentLevel -= 1
    if (indentLevel < 0) {
      indentLevel = 0
    }
  }

  console.info = function() {
    return logEverywhere('info', Array.from(arguments))
  }

  console.log = function() {
    return logEverywhere('log', Array.from(arguments))
  }

  var timers = {}

  console.time = function(label) {
    label = typeof label !== 'undefined' ? label : 'default'
    if (timers[label]) {
      return logEverywhere('warn', ['Timer "' + label + '" already exists'])
    }

    timers[label] = Date.now()
    return
  }

  console.timeEnd = function(label) {
    label = typeof label !== 'undefined' ? label : 'default'
    if (!timers[label]) {
      return logEverywhere('warn', ['Timer "' + label + '" does not exist'])
    }

    var duration = Date.now() - timers[label]
    delete timers[label]
    return logEverywhere('log', [label + ': ' + (duration / 1000) + 'ms'])
  }

  console.trace = function() {
    // TODO:
  }

  console.warn = function() {
    return logEverywhere('warn', Array.from(arguments))
  }

  return console
}
