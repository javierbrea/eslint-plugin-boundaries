import { act, renderHook } from "@testing-library/react";

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
