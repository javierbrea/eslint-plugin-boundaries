import { ProjectPane } from "./index";

describe("project", () => {
  it("should export the project pane, which is a memoized component", () => {
    // Assert
    expect(typeof ProjectPane).toBe("object");
    expect(ProjectPane).toHaveProperty("$$typeof", Symbol.for("react.memo"));
  });
});
