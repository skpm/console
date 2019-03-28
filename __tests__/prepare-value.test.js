/* globals test, expect */
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
