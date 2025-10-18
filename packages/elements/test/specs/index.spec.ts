import { ElementsDescriptor } from "../../src/index";

describe("package", () => {
  describe("elementsDescriptor", () => {
    it("should be exported as named export", () => {
      expect(ElementsDescriptor).toBeDefined();
    });
  });
});
