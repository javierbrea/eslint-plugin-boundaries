import { ConfigPane, EmptyPane, FilePane, NodePane } from "./index";

describe("node", () => {
  it("should export the pane of each state of the node in focus", () => {
    // Assert
    expect(typeof ConfigPane).toBe("function");
    expect(typeof EmptyPane).toBe("function");
    expect(typeof FilePane).toBe("function");
  });

  it("should export the node pane, which is a memoized component", () => {
    // Assert
    expect(NodePane).toHaveProperty("$$typeof", Symbol.for("react.memo"));
  });
});
