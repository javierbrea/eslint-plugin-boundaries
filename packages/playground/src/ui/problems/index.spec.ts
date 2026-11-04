import {
  ProblemList,
  ProblemsPanel,
  getConfigProblemItems,
  getCountTone,
  getTabLabel,
  getTextProblemItems,
} from "./index";

describe("problems", () => {
  it("should export the panel and the list", () => {
    // Assert
    expect(typeof ProblemsPanel).toBe("function");
    expect(typeof ProblemList).toBe("function");
  });

  it("should export the builders of rows, tab labels and count tones", () => {
    // Assert
    expect(typeof getConfigProblemItems).toBe("function");
    expect(typeof getTextProblemItems).toBe("function");
    expect(typeof getTabLabel).toBe("function");
    expect(typeof getCountTone).toBe("function");
  });
});
