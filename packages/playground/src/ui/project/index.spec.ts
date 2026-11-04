import { ProjectPane } from "./index";

describe("project", () => {
  it("should export the project pane", () => {
    // Assert
    expect(typeof ProjectPane).toBe("function");
  });
});
