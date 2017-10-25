/* globals log */
if (!console._skpmEnabled) {
  var sketchDebugger = require('@skpm/sketch-debugger/debugger')
  var actions = require('@skpm/sketch-debugger/shared-actions')

  var threadDictionary = NSThread.mainThread().threadDictionary()

  function toArray(object) {
    if (Array.isArray(object)) {
      return object
    }
    const arr = []
    for (let j = 0; j < object.count(); j += 1) {
      arr.push(object.objectAtIndex(j))
    }
    return arr
  }

  function prepareValue (value) {
    var type = 'String';
    var typeOf = typeof value;
    if (value instanceof Error) {
      type = 'Error';
    } else if (Array.isArray(value)) {
      type = 'Array';
      value = prepareArrayDeep(value);
    } else if (typeOf === 'object') {
      if (value.isKindOfClass && typeof value.class === 'function') {
        type = String(value.class());
        // TODO: Here could come some meta data saved as value
        if (type == 'NSDictionary' || type == '__NSDictionaryM') {
          type = 'NSDictionary';
          value = prepareObjectDeep(Object(value));
        } else if (type == 'NSArray' || type == 'NSMutableArray') {
          value = prepareArrayDeep(toArray(value));
        } else {
          value = type;
        }
      } else {
        type = 'Object';
        value = prepareObjectDeep(value);
      }
    } else if (typeOf === 'function') {
      type = 'Function';
    } else if (value === true || value === false) {
      type = 'Boolean';
    } else if (value === null || value === undefined || Number.isNaN(value)) {
      type = 'Empty';
    } else if (typeOf === 'number') {
      type = 'Number';
    }

    return { value, type };
  }

  function prepareArrayDeep (array) {
    return array.map(prepareValue);
  }

  function prepareObjectDeep (object) {
    let deep = {};
    Object.keys(object).forEach(function (key) {
      deep[key] = prepareValue(object[key]);
    });
    return deep;
  }

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
      log(indentString() + v)
    })

    if (!sketchDebugger.isDebuggerPresent()) {
      return
    }

    const payload = {
      ts: Date.now(),
      type,
      values: values.map(prepareValue),
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

  console._skpmEnabled = true

  // polyfill the global object
  var commonjsGlobal = typeof global !== 'undefined'
  ? global
  : this

  commonjsGlobal.console = console
}

module.exports = console
