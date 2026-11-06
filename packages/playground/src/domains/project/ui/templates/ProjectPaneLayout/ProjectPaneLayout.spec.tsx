import { render } from "@testing-library/react";

import { ProjectPaneLayout } from "./ProjectPaneLayout";
import { ProjectPaneLayoutPom } from "./ProjectPaneLayout.pom";
import type { ProjectPaneLayoutProps } from "./ProjectPaneLayout.types";

/**
 * Renders the layout with a body and a foot.
 * @param changes What differs from the layout of a project shown as a tree.
 * @returns The page object of the layout.
 */
function renderLayout(
  changes: Partial<ProjectPaneLayoutProps> = {}
): ProjectPaneLayoutPom {
  render(
    <ProjectPaneLayout view="tree" foot={<p>The foot</p>} {...changes}>
      <p>The body</p>
    </ProjectPaneLayout>
  );

  return new ProjectPaneLayoutPom({ testId: changes.testId });
}

describe("ProjectPaneLayout", () => {
  describe("pane", () => {
    it("should be the region that its label names, laid out in a grid", () => {
      // Arrange
      const layout = renderLayout();

      // Act
      const { tagName, display } = layout;
      const isNamedRegion = layout.isRegionNamed("Project");

      // Assert
      expect(isNamedRegion).toBe(true);
      expect(tagName).toBe("SECTION");
      expect(display).toBe("grid");
    });

    it("should place the head, the body and the foot in order", () => {
      // Arrange
      const layout = renderLayout();

      // Act
      const { childTexts } = layout;

      // Assert
      expect(childTexts).toEqual(["Project", "The body", "The foot"]);
    });
  });

  describe("view", () => {
    it("should add a hint to the head while the project is shown as text", () => {
      // Arrange
      const layout = renderLayout({ view: "text" });

      // Act
      const { hint } = layout.head;

      // Assert
      expect(hint).toBe("One path per line");
    });

    it("should add no hint to the head while the project is shown as a tree", () => {
      // Arrange
      const layout = renderLayout({ view: "tree" });

      // Act
      const { hint } = layout.head;

      // Assert
      expect(hint).toBeNull();
    });
  });

  describe("testId", () => {
    it("should render the test id of a module that is the pane in place of its own", () => {
      // Arrange
      const layout = renderLayout({ testId: "project-pane" });

      // Act
      const { isRendered } = layout;

      // Assert
      expect(isRendered).toBe(true);
      expect(new ProjectPaneLayoutPom().isRendered).toBe(false);
    });
  });
});
