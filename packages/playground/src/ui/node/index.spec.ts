import { ConfigPane, EmptyPane, FilePane } from "./index";

describe("node", () => {
  it("should export the pane of each state of the node in focus", () => {
    // Assert
    expect(typeof ConfigPane).toBe("function");
    expect(typeof EmptyPane).toBe("function");
    expect(typeof FilePane).toBe("function");
  });
});
