import { ElementsMatcher } from "../../../src/Selector/ElementsMatcher";

describe("elementsMatcher", () => {
  it("should have isMatch method", () => {
    const matcher = new ElementsMatcher("foo-type");

    expect(
      matcher.isMatch({
        type: "foo-type",
        category: null,
        capturedValues: {},
        capture: null,
        path: "/src/test.ts",
        elementPath: "/src",
        internalPath: "test.ts",
        isIgnored: false,
        parents: [],
      }),
    ).toBe(true);
  });
});
