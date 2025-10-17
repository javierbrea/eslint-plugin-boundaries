import { ElementsDescriptor } from "../../src/index";

describe("package", () => {
  describe("elementsDescriptor", () => {
    it("should be exported as named export", () => {
      expect(ElementsDescriptor).toBeDefined();
    });

    it("should have describe method", () => {
      const descriptor = new ElementsDescriptor();

      expect(descriptor.describe()).toBe("I am an Elements Descriptor");
    });
  });
});
