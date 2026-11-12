import { act, renderHook } from "@testing-library/react";

import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import { renderHookInSession } from "@/domains/session/data/store/store.mock";

import { useSelectedDependency } from "./useSelectedDependency";

const QUICK_START = QUICK_START_EXAMPLE.sketch;

const CHECKOUT = "src/modules/checkout/index.js";

const ENTRY = "src/index.js";

describe("useSelectedDependency", () => {
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
      const render = (): unknown =>
        renderHook(() => useSelectedDependency(CHECKOUT));

      // Assert
      expect(render).toThrow("outside SessionProvider");
    });
  });

  it("should read no dependency while nothing is in focus", () => {
    // Act
    const { result } = renderHookInSession(
      () => useSelectedDependency(CHECKOUT),
      QUICK_START
    );

    // Assert
    expect(result.current).toBeUndefined();
  });

  it("should read no dependency while the file is in focus", () => {
    // Arrange
    const { result, store } = renderHookInSession(
      () => useSelectedDependency(CHECKOUT),
      QUICK_START
    );

    // Act
    act(() => store.open({ kind: "file", path: CHECKOUT }));

    // Assert
    expect(result.current).toBeUndefined();
  });

  it("should read the position of the dependency of the file that is in focus", () => {
    // Arrange
    const { result, store } = renderHookInSession(
      () => useSelectedDependency(CHECKOUT),
      QUICK_START
    );

    // Act
    act(() => store.open({ kind: "dependency", path: CHECKOUT, index: 2 }));

    // Assert
    expect(result.current).toBe(2);
  });

  it("should read no dependency when the one in focus belongs to another file", () => {
    // Arrange
    const { result, store } = renderHookInSession(
      () => useSelectedDependency(CHECKOUT),
      QUICK_START
    );

    // Act
    act(() => store.open({ kind: "dependency", path: ENTRY, index: 0 }));

    // Assert
    expect(result.current).toBeUndefined();
  });

  it("should render again only when the line in focus changes", () => {
    // Arrange
    const { result, results, store } = renderHookInSession(
      () => useSelectedDependency(CHECKOUT),
      QUICK_START
    );
    act(() => store.open({ kind: "dependency", path: CHECKOUT, index: 1 }));
    const renders = results.length;

    // Act
    act(() => store.open({ kind: "dependency", path: CHECKOUT, index: 1 }));
    act(() => store.open({ kind: "dependency", path: ENTRY, index: 0 }));
    act(() => store.open({ kind: "dependency", path: CHECKOUT, index: 3 }));

    // Assert
    expect(results.length - renders).toBe(2);
    expect(result.current).toBe(3);
  });
});
