import { ConfigEditor } from "./index";

describe("config", () => {
  it("should export the config editor", () => {
    // Assert
    expect(typeof ConfigEditor).toBe("function");
  });
});
