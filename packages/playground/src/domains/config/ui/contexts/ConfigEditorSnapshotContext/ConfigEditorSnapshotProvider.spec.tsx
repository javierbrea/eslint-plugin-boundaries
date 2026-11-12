import { act, renderHook } from "@testing-library/react";
import { useState } from "react";

import type { ConfigEditorSnapshot } from "./configEditorSnapshot.types";
import { ConfigEditorSnapshotProvider } from "./ConfigEditorSnapshotProvider";
import { useConfigEditorSnapshot } from "./useConfigEditorSnapshot";

/**
 * Reads the snapshot in a component that can render again by itself, without its provider.
 * @returns The ref of the snapshot, and the function that renders the component again.
 */
function useSnapshotWithRender(): {
  snapshot: ReturnType<typeof useConfigEditorSnapshot>;
  renderAgain: () => void;
} {
  const [, setCount] = useState(0);

  return {
    snapshot: useConfigEditorSnapshot(),
    renderAgain: () => setCount((count) => count + 1),
  };
}

describe("ConfigEditorSnapshotProvider", () => {
  describe("snapshot", () => {
    it("should give a ref that holds nothing at first", () => {
      // Act
      const { result } = renderHook(useConfigEditorSnapshot, {
        wrapper: ConfigEditorSnapshotProvider,
      });

      // Assert
      expect(result.current.current).toBeUndefined();
    });

    it("should give the same ref on every render of the provider, with what was left in it", () => {
      // Arrange
      const { result, rerender } = renderHook(useConfigEditorSnapshot, {
        wrapper: ConfigEditorSnapshotProvider,
      });
      const first = result.current;
      const snapshot = {} as unknown as ConfigEditorSnapshot;

      first.current = snapshot;

      // Act
      rerender();

      // Assert
      expect(result.current).toBe(first);
      expect(result.current.current).toBe(snapshot);
    });

    it("should give the same ref when only the component renders again", () => {
      // Arrange
      const { result } = renderHook(useSnapshotWithRender, {
        wrapper: ConfigEditorSnapshotProvider,
      });
      const first = result.current.snapshot;

      // Act
      act(() => result.current.renderAgain());

      // Assert
      expect(result.current.snapshot).toBe(first);
    });

    it("should give each provider a ref of its own", () => {
      // Act
      const first = renderHook(useConfigEditorSnapshot, {
        wrapper: ConfigEditorSnapshotProvider,
      });
      const second = renderHook(useConfigEditorSnapshot, {
        wrapper: ConfigEditorSnapshotProvider,
      });

      // Assert
      expect(first.result.current).not.toBe(second.result.current);
    });
  });

  describe("outside the provider", () => {
    beforeEach(() => {
      // React logs the error that a component throws
      jest.spyOn(console, "error").mockReturnValue(undefined);
    });

    afterEach(() => {
      jest.mocked(console.error).mockRestore();
    });

    it("should throw when useConfigEditorSnapshot is used in a pane outside ConfigEditorSnapshotProvider", () => {
      // Act
      const render = (): unknown => renderHook(useConfigEditorSnapshot);

      // Assert
      expect(render).toThrow("outside ConfigEditorSnapshotProvider");
    });
  });
});
