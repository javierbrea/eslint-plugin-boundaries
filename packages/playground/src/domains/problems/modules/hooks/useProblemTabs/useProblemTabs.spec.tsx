import { act, renderHook } from "@testing-library/react";

import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import { useView } from "@/domains/session/data/store";
import { renderHookInSession } from "@/domains/session/data/store/store.mock";

import { useProblemTabs } from "./useProblemTabs";

describe("useProblemTabs", () => {
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
      const render = (): unknown => renderHook(useProblemTabs);

      // Assert
      expect(render).toThrow("outside SessionProvider");
    });
  });

  it("should give the tab of the sketch when nothing is in focus", () => {
    // Act
    const { result } = renderHookInSession(useProblemTabs);

    // Assert
    expect(result.current).toEqual([
      {
        id: "sketch",
        subject: { kind: "sketch" },
        badge: { count: 1, hasErrors: false },
      },
    ]);
  });

  it("should add the tab of the config when it is in focus", () => {
    // Arrange
    const { store, result } = renderHookInSession(useProblemTabs);

    // Act
    act(() => store.open({ kind: "config" }));

    // Assert
    expect(result.current).toEqual([
      {
        id: "sketch",
        subject: { kind: "sketch" },
        badge: { count: 1, hasErrors: false },
      },
      {
        id: "node",
        subject: { kind: "config" },
        badge: { count: 1, hasErrors: false },
      },
    ]);
  });

  it("should add the tab of the file in focus", () => {
    // Arrange
    const { store, result } = renderHookInSession(useProblemTabs);

    // Act
    act(() => store.open({ kind: "file", path: "src/helpers/format.js" }));

    // Assert
    expect(result.current.map(({ id, subject }) => [id, subject])).toEqual([
      ["sketch", { kind: "sketch" }],
      ["node", { kind: "file", path: "src/helpers/format.js" }],
    ]);
  });

  it("should add the tab of the dependency in focus, with its verdict, after the tab of its file", () => {
    // Arrange
    const { store, result } = renderHookInSession(
      useProblemTabs,
      QUICK_START_EXAMPLE.sketch
    );

    // Act
    act(() =>
      store.open({
        kind: "dependency",
        path: "src/modules/checkout/index.js",
        index: 2,
      })
    );

    // Assert
    expect(result.current.map(({ id, subject }) => [id, subject])).toEqual([
      ["sketch", { kind: "sketch" }],
      ["node", { kind: "file", path: "src/modules/checkout/index.js" }],
      [
        "dependency",
        {
          kind: "dependency",
          ref: { path: "src/modules/checkout/index.js", index: 2 },
        },
      ],
    ]);
    expect(result.current[1].badge).toEqual({ count: 1, hasErrors: true });
    expect(result.current[2].verdict).toEqual(
      expect.objectContaining({ status: "disallowed", level: "error" })
    );
  });

  it("should count the failing dependencies in the tab of the sketch", () => {
    // Act
    const { result } = renderHookInSession(
      useProblemTabs,
      QUICK_START_EXAMPLE.sketch
    );

    // Assert
    expect(result.current[0].badge).toEqual({ count: 2, hasErrors: true });
  });

  it("should give the same array while the focus and the problems do not change", () => {
    // Arrange
    const { store, results } = renderHookInSession(() => ({
      tabs: useProblemTabs(),
      view: useView(),
    }));

    // Act
    act(() => store.setView("text"));

    // Assert
    expect(results).toHaveLength(2);
    expect(results[1].tabs).toBe(results[0].tabs);
  });
});
