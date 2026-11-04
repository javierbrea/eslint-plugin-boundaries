import {
  CountBadge,
  Mono,
  Note,
  PaneHead,
  TONE_COLORS,
  formatCount,
} from "./index";

describe("common", () => {
  it("should export the components", () => {
    // Assert
    expect(typeof CountBadge).toBe("function");
    expect(typeof Mono).toBe("function");
    expect(typeof Note).toBe("function");
    expect(typeof PaneHead).toBe("function");
  });

  it("should export the tone colors and the count formatter", () => {
    // Assert
    expect(Object.keys(TONE_COLORS)).toEqual(["bad", "warn"]);
    expect(typeof formatCount).toBe("function");
  });
});
