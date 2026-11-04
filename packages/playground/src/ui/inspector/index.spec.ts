import { Inspector, formatValue } from "./index";

describe("inspector", () => {
  it("should export the inspector and the formatter of described values", () => {
    // Assert
    expect(typeof Inspector).toBe("function");
    expect(typeof formatValue).toBe("function");
  });
});
