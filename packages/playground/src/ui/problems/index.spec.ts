import { ProblemList, ProblemsPane, ProblemsPanel } from "./index";

describe("problems", () => {
  it("should export the panel and the list", () => {
    // Assert
    expect(typeof ProblemsPanel).toBe("function");
    expect(typeof ProblemList).toBe("function");
  });

  it("should export the problems pane, which is a memoized component", () => {
    // Assert
    expect(ProblemsPane).toHaveProperty("$$typeof", Symbol.for("react.memo"));
  });
});
