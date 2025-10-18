import { ElementsDescriptor } from "../../../src/Descriptor/ElementsDescriptor";

describe("elementsDescriptor", () => {
  it("should have describe method", () => {
    const descriptor = new ElementsDescriptor();

    expect(descriptor.describe()).toBe("I am an Elements Descriptor");
  });
});
