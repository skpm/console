/* globals log */
if (!console._skpmEnabled) {
  var sketchDebugger = require('@skpm/sketch-debugger/debugger')
  var actions = require('@skpm/sketch-debugger/shared-actions')

  var threadDictionary = NSThread.mainThread().threadDictionary()

  function getStack (withError = new Error()) {
    let stack = withError.stack.split('\n');
    stack = stack.map(s => s.replace(/\s\g/, ''));

    stack = stack.map(entry => {
      let fn = null;
      let file = null;
      let line = null;
      let column = null;
      let split = entry.split('@');
      fn = split[0];
      file = split[1];

      if (file) {
        split = file.split(':');
        file = split[0];
        line = split[1];
        column = split[2];
      }

      const filePath = file;

      if (file) {
        file = file.split('/');
        file = file[file.length - 1];
      }
      return { fn, file, filePath, line, column };
    });

    const deleteAllUntil = stack.findIndex(function(s) { return s.fn == 'log' });
    stack.splice(0, deleteAllUntil);

    return stack;
  }

  function logEverywhere (type, args) {
    var values = Array.prototype.slice.call(args)

    // log to the System logs
    values.forEach(function (v) {
      try {
        log(indentString() + v)
      } catch (e) {
        log(v)
      }
    })

    if (!sketchDebugger.isDebuggerPresent()) {
      return
    }

    const payload = {
      ts: Date.now(),
      type,
      values: values.map(sketchDebugger.prepareValue),
      stack: getStack()
    };

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

  console.log = function () {
    // log to the JS context
    oldLog && oldLog.apply(this, arguments)
    return logEverywhere('log', arguments)
  }

  var oldWarn = console.warn

  console.warn = function () {
    // log to the JS context
    oldWarn && oldWarn.apply(this, arguments)
    return logEverywhere('warn', arguments)
  }

  var oldError = console.error

  console.error = function () {
    // log to the JS context
    oldError && oldError.apply(this, arguments)
    return logEverywhere('error', arguments)
  }

  var oldAssert = console.assert

  console.assert = function (condition, text) {
    // log to the JS context
    oldAssert && oldAssert.apply(this, arguments)
    if (!condition) {
      return logEverywhere('assert', [text])
    }
    return undefined
  }

  var oldInfo = console.info

  console.info = function () {
    // log to the JS context
    oldInfo && oldInfo.apply(this, arguments)
    return logEverywhere('info', arguments)
  }

  var oldClear = console.clear

  console.clear = function () {
    oldClear && oldClear()
    return sketchDebugger.sendToDebugger(actions.CLEAR_LOGS)
  }

  console._skpmEnabled = true

  // polyfill the global object
  var commonjsGlobal = typeof global !== 'undefined'
  ? global
  : this

  commonjsGlobal.console = console
}

module.exports = console
