import { ElementsDescriptor } from "../../../src/Descriptor/ElementsDescriptor";

describe("elementsDescriptor", () => {
  it("should have describe method", () => {
    const descriptor = new ElementsDescriptor([
      {
        type: "foo",
        pattern: "**/*",
      },
    ]);

    expect(descriptor.describeFile("foo")).not.toThrow();
  });
});
