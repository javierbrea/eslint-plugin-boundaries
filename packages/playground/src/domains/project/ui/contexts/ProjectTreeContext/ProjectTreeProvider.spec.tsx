import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import type { ProblemCounts } from "@/domains/problems/helpers/problemSelectors";

import type { ProjectTreeContextValue } from "./projectTreeContext.types";
import { ProjectTreeProvider } from "./ProjectTreeProvider";
import { useProjectTreeContext } from "./useProjectTreeContext";

const NO_COUNTS: ProblemCounts = {
  config: 0,
  configHasErrors: false,
  byPath: new Map(),
};

const VALUE: ProjectTreeContextValue = {
  counts: NO_COUNTS,
  editable: true,
  target: undefined,
  renaming: "src/index.js",
  focusRequest: undefined,
  onFocusDone: jest.fn(),
  onRename: jest.fn(),
  onRenameCommit: jest.fn(),
  onRenameCancel: jest.fn(),
  onDelete: jest.fn(),
  onOpenMenu: jest.fn(),
};

/**
 * Wraps a hook in the provider with the value of the spec.
 * @param props Wrapper props.
 * @param props.children The hook under test.
 * @returns The provider.
 */
function Wrapper({ children }: Readonly<{ children: ReactNode }>): ReactNode {
  return <ProjectTreeProvider value={VALUE}>{children}</ProjectTreeProvider>;
}

describe("ProjectTreeProvider", () => {
  describe("value", () => {
    it("should give the items the value of the tree, as it is", () => {
      // Act
      const { result } = renderHook(useProjectTreeContext, {
        wrapper: Wrapper,
      });

      // Assert
      expect(result.current).toBe(VALUE);
    });

    it("should give the items the new value when the tree gives one", () => {
      // Arrange
      let value = VALUE;
      const { result, rerender } = renderHook(useProjectTreeContext, {
        wrapper: ({ children }) => (
          <ProjectTreeProvider value={value}>{children}</ProjectTreeProvider>
        ),
      });

      // Act
      value = { ...VALUE, editable: false };
      rerender();

      // Assert
      expect(result.current).toBe(value);
      expect(result.current.editable).toBe(false);
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

    it("should throw when useProjectTreeContext is used by an item outside ProjectTreeProvider", () => {
      // Act
      const render = (): unknown => renderHook(useProjectTreeContext);

      // Assert
      expect(render).toThrow("outside ProjectTreeProvider");
    });
  });
});
