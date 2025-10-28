import { Elements } from "../../src/index";

describe("package", () => {
  describe("elements", () => {
    it("should be exported as named export", () => {
      expect(Elements).toBeDefined();
    });
  });
});
