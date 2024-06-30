const {test} = require("node:test");
const assert = require("node:assert");

// import function to be tested and assign it to variable
const reverse = require("../utils/for_testing").reverse;

// test description, functionality for the test case
test("reverse of a", () => {
  const result = reverse("a");
  //   verify the result
  assert.strictEqual(result, "a");
});

test("reverse of react", () => {
  const result = reverse("react");
  assert.strictEqual(result, "tcaer");
});

test("reverse of saippuakauppias", () => {
  const result = reverse("saippuakauppias");

  assert.strictEqual(result, "saippuakauppias");
});
