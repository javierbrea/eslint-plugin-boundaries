import { render } from "@testing-library/react";

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
});
