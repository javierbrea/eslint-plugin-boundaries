import { act, renderHook } from "@testing-library/react";

import { renderHookInSession } from "@/domains/session/data/store/store.mock";

import { useShownTab } from "./useShownTab";

describe("useShownTab", () => {
  describe("outside the provider", () => {
    beforeEach(() => {
      // React logs the error that a component throws
      jest.spyOn(console, "error").mockReturnValue(undefined);
    });

    afterEach(() => {
      jest.mocked(console.error).mockRestore();
    });

    it("should throw when it is used in a pane outside SessionProvider", () => {
      // Act
      const render = (): unknown => renderHook(useShownTab);

      // Assert
      expect(render).toThrow("outside SessionProvider");
    });
  });

  it("should be the sketch's when nothing is in focus", () => {
    // Act
    const { result } = renderHookInSession(useShownTab);

    // Assert
    expect(result.current).toBe("sketch");
  });

  it("should be the sketch's when nothing is in focus, whatever tab was selected", () => {
    // Arrange
    const { store, result } = renderHookInSession(useShownTab);

    // Act
    act(() => store.selectTab("node"));

    // Assert
    expect(result.current).toBe("sketch");
  });

  it("should be the tab of the node when something is opened", () => {
    // Arrange
    const { store, result } = renderHookInSession(useShownTab);

    // Act
    act(() => store.open({ kind: "config" }));

    // Assert
    expect(result.current).toBe("node");
  });

  it("should be the tab that the user selects while something is in focus", () => {
    // Arrange
    const { store, result } = renderHookInSession(useShownTab);

    act(() => store.open({ kind: "file", path: "src/index.js" }));

    // Act
    act(() => store.selectTab("sketch"));

    // Assert
    expect(result.current).toBe("sketch");
  });

  it("should be the tab of the dependency when a dependency is opened", () => {
    // Arrange
    const { store, result } = renderHookInSession(useShownTab);

    // Act
    act(() =>
      store.open({ kind: "dependency", path: "src/index.js", index: 0 })
    );

    // Assert
    expect(result.current).toBe("dependency");
  });

  it("should go back to the tab of the node when the dependency is no longer in focus though the tab of the dependency is selected", () => {
    // Arrange
    const { store, result } = renderHookInSession(useShownTab);

    act(() =>
      store.open({ kind: "dependency", path: "src/index.js", index: 0 })
    );

    // Act
    act(() => store.open({ kind: "config" }));
    act(() => store.selectTab("dependency"));

    // Assert
    expect(result.current).toBe("node");
  });
});
