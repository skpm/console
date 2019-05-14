/* globals test, expect, NSMakeRange */
const prepareValue = require("../prepare-value")

test("should prepare an Error", () => {
  expect(prepareValue(new Error("error")).value.message).toBe("error")
})

test("should prepare an Number", () => {
  expect(prepareValue(1)).toEqual({
    value: 1,
    type: "Number",
    primitive: "Number"
  })
})

test("should prepare an String", () => {
  expect(prepareValue("test")).toEqual({
    value: "test",
    type: "String",
    primitive: "String"
  })
})

test("should prepare an Object", () => {
  expect(prepareValue({ a: "b" })).toEqual({
    value: { a: { value: "b", type: "String", primitive: "String" } },
    type: "Object",
    primitive: "Object"
  })
})

test("should prepare an Array", () => {
  expect(prepareValue(["a", "b"])).toEqual({
    value: [
      { value: "a", type: "String", primitive: "String" },
      { value: "b", type: "String", primitive: "String" }
    ],
    type: "Array",
    primitive: "Array"
  })
})

test("should prepare circular objects", () => {
  const arr = []
  arr[0] = arr
  expect(prepareValue(arr)).toEqual({
    value: [{ value: [], type: "Circular", primitive: "Array" }],
    type: "Array",
    primitive: "Array"
  })
})

test("should prepare a wrapped object", (context, document) => {
  document.sketchObject.objectID = 'test'
  document.pages[0].sketchObject.objectID = 'test-page'
  expect(prepareValue(document)).toEqual(
  { value:
      { type: { value: 'Document', type: 'String', primitive: 'String' },
        id: { value: 'test', type: 'String', primitive: 'String' },
        pages: { value: [{ value:
          { type: { value: 'Page', type: 'String', primitive: 'String' },
            id: { value: 'test-page', type: 'String', primitive: 'String' },
            frame: { value:
              { x: { value: 0, type: 'Number', primitive: 'Number' },
                y: { value: 0, type: 'Number', primitive: 'Number' },
                width: { value: 0, type: 'Number', primitive: 'Number' },
                height: { value: 0, type: 'Number', primitive: 'Number' } }
                , type: 'Object', primitive: 'Object' },
            name: { value: 'Page 1', type: 'String', primitive: 'String' },
            selected: { value: true, type: 'Boolean', primitive: 'Boolean' },
            sharedStyleId: { value: 'null', type: 'Empty', primitive: 'Empty' },
            layers: { value: [], type: 'Array', primitive: 'Array' } },
          type: 'Page',
          primitive: 'Object' }], type: 'Array', primitive: 'Array' },
        colors: { value: [], type: 'Array', primitive: 'Array' },
        gradients: { value: [], type: 'Array', primitive: 'Array' },
        sharedLayerStyles: { value: [], type: 'Array', primitive: 'Array' },
        sharedTextStyles: { value: [], type: 'Array', primitive: 'Array' } },
    type: 'Document',
    primitive: 'Object' }
  )
})

test("should prepare an error", () => {
  const err = new Error('this is an error')
  expect(prepareValue(err).type).toEqual('Error')
})

test("should prepare an NSRange", () => {
  const range = NSMakeRange(0,5)
  expect(prepareValue(range)).toEqual({ value:
    { location: { value: 0, type: '__NSCFNumber', primitive: 'Number' },
      length: { value: 5, type: '__NSCFNumber', primitive: 'Number' } },
    type: 'MOStruct',
    primitive: 'Object' })
})
