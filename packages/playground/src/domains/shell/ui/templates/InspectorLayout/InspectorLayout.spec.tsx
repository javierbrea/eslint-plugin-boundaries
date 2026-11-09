import { render } from "@testing-library/react";

import { renderInRoot } from "@/shared/testing/renderInRoot";

import { InspectorLayout } from "./InspectorLayout";
import { InspectorLayoutPom } from "./InspectorLayout.pom";

describe("InspectorLayout", () => {
  describe("pane", () => {
    it("should be the landmark of the inspector, with its label in the head", () => {
      // Arrange
      render(<InspectorLayout>What is in focus</InspectorLayout>);
      const layout = new InspectorLayoutPom();

      // Act
      const { text, head } = layout;
      const isNamedLandmark = layout.isComplementaryNamed("Inspector");

      // Assert
      expect(isNamedLandmark).toBe(true);
      expect(text).toContain("Inspector");
      expect(text).toContain("What is in focus");
      expect(head.itemTexts).toEqual(["Inspector", ""]);
    });
  });

  describe("content", () => {
    it("should keep each part at the height of what it holds, so that the content scrolls instead of cutting it", () => {
      // Arrange
      renderInRoot(<InspectorLayout>What is in focus</InspectorLayout>);
      const layout = new InspectorLayoutPom();

      // Act
      const { contentRowSizing } = layout;

      // Assert
      expect(contentRowSizing).toBe("max-content");
    });
  });
});
