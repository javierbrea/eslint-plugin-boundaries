import { render } from "@testing-library/react";

import { TopBar } from "@/domains/shell/ui/atoms/TopBar";
import { ShellRegions } from "@/domains/shell/ui/templates/ShellRegions";
import { stubResizeObserver } from "@/shared/testing/resizeObserver";

import { ShellLayout } from "./ShellLayout";
import { ShellLayoutPom } from "./ShellLayout.pom";
import type { ShellLayoutProps } from "./ShellLayout.types";

/**
 * Renders the layout with a probe in each slot.
 * @param changes What differs from a layout of two probes.
 * @returns The page object of the layout.
 */
function renderLayout(changes: Partial<ShellLayoutProps> = {}): ShellLayoutPom {
  render(
    <ShellLayout
      topBar={<p>The top bar</p>}
      regions={<p>The regions</p>}
      {...changes}
    />
  );

  return new ShellLayoutPom({ testId: changes.testId });
}

describe("ShellLayout", () => {
  beforeEach(() => {
    stubResizeObserver();
  });

  describe("frame", () => {
    it("should be the region that its label names", () => {
      // Arrange
      const layout = renderLayout();

      // Act
      const { tagName } = layout;

      // Assert
      expect(layout.isRegionNamed("Playground")).toBe(true);
      expect(layout.isRegionNamed("Another name")).toBe(false);
      expect(tagName).toBe("SECTION");
    });

    it("should fill its container without growing past it", () => {
      // Arrange
      const layout = renderLayout();

      // Act
      const { boxSizing, width, height, minWidth, minHeight } = layout;

      // Assert
      expect(boxSizing).toBe("border-box");
      expect(width).toBe("100%");
      expect(height).toBe("100%");
      expect(minWidth).toBe("0");
      expect(minHeight).toBe("0");
    });
  });

  describe("grid", () => {
    it("should give the top bar a row of 44 px and the regions the rest", () => {
      // Arrange
      const layout = renderLayout();

      // Act
      const { gridDisplay, gridRows, gridHeight } = layout;

      // Assert
      expect(gridDisplay).toBe("grid");
      expect(gridRows).toBe("44px minmax(0, 1fr)");
      expect(gridHeight).toBe("100%");
    });

    it("should place the top bar before the regions", () => {
      // Arrange
      const layout = renderLayout();

      // Act
      const { childTexts } = layout;

      // Assert
      expect(childTexts).toEqual(["The top bar", "The regions"]);
    });

    it("should hold the top bar and the regions it is given", () => {
      // Arrange
      render(
        <ShellLayout
          topBar={
            <TopBar
              files={6}
              problems={2}
              tone="warn"
              configHasErrors={false}
            />
          }
          regions={
            <ShellRegions
              project={<p>The project</p>}
              node={<p>The node</p>}
              inspector={<p>The inspector</p>}
              problems={<p>The problems</p>}
              isTextMode={false}
              isProblemsCollapsed={false}
              onProblemsCollapsedChange={jest.fn()}
            />
          }
        />
      );
      const layout = new ShellLayoutPom();

      // Act
      const { topBar, regions } = layout;

      // Assert
      expect(topBar.statusText).toBe("6 files · 2 problems");
      expect(regions.holds("The node")).toBe(true);
    });
  });

  describe("testId", () => {
    it("should render the test id of the layout by default", () => {
      // Arrange
      renderLayout();

      // Act
      const { isRendered } = new ShellLayoutPom({ testId: "shell-layout" });

      // Assert
      expect(isRendered).toBe(true);
    });

    it("should render the test id of a module that is the shell in place of its own", () => {
      // Arrange
      const layout = renderLayout({ testId: "shell" });

      // Act
      const { isRendered } = layout;

      // Assert
      expect(isRendered).toBe(true);
      expect(new ShellLayoutPom().isRendered).toBe(false);
    });
  });
});
