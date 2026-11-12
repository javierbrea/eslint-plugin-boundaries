import { act, renderHook } from "@testing-library/react";

import {
  EXAMPLES,
  QUICK_START_EXAMPLE,
} from "@/domains/examples/data/examples";
import { renderHookInSession } from "@/domains/session/data/store/store.mock";

import { useCurrentExample } from "./useCurrentExample";

describe("useCurrentExample", () => {
  describe("outside the provider", () => {
    beforeEach(() => {
      // React logs the error that a component throws
      jest.spyOn(console, "error").mockReturnValue(undefined);
    });

    afterEach(() => {
      jest.mocked(console.error).mockRestore();
    });

    it("should throw when it is used outside SessionProvider", () => {
      // Act
      const render = (): unknown => renderHook(useCurrentExample);

      // Assert
      expect(render).toThrow("outside SessionProvider");
    });
  });

  it.each(EXAMPLES.map((example) => [example.id, example] as const))(
    "should be the %s example while the sketch is that example",
    (_id, example) => {
      // Act
      const { result } = renderHookInSession(useCurrentExample, example.sketch);

      // Assert
      expect(result.current).toBe(example);
    }
  );

  it("should be none once a dependency is removed", () => {
    // Arrange
    const { store, result } = renderHookInSession(
      useCurrentExample,
      QUICK_START_EXAMPLE.sketch
    );

    // Act
    act(() => store.removeDependency({ path: "src/index.js", index: 0 }));

    // Assert
    expect(result.current).toBeUndefined();
  });

  it("should be the example again once the edit of the config is undone", () => {
    // Arrange
    const { store, result } = renderHookInSession(
      useCurrentExample,
      QUICK_START_EXAMPLE.sketch
    );

    act(() => store.changeConfig("{ settings: {}, rules: {} }"));

    const afterEdit = result.current;

    // Act
    act(() => store.changeConfig(QUICK_START_EXAMPLE.sketch.config));

    // Assert
    expect(afterEdit).toBeUndefined();
    expect(result.current).toBe(QUICK_START_EXAMPLE);
  });

  it("should be none when the config is edited", () => {
    // Arrange
    const { store, result } = renderHookInSession(
      useCurrentExample,
      QUICK_START_EXAMPLE.sketch
    );

    // Act
    act(() => store.changeConfig("{ settings: {}, rules: {} }"));

    // Assert
    expect(result.current).toBeUndefined();
  });

  it("should be none for a sketch that no example has", () => {
    // Act
    const { result } = renderHookInSession(useCurrentExample);

    // Assert
    expect(result.current).toBeUndefined();
  });
});
