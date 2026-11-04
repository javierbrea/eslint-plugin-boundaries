import { Inspector, InspectorPane } from "./index";

describe("inspector", () => {
  it("should export the inspector", () => {
    // Assert
    expect(typeof Inspector).toBe("function");
  });

  it("should export the inspector pane, which is a memoized component", () => {
    // Assert
    expect(InspectorPane).toHaveProperty("$$typeof", Symbol.for("react.memo"));
  });
});
