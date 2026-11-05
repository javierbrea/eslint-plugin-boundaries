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
      const { isLandmark, label, text, head } = layout;

      // Assert
      expect(isLandmark).toBe(true);
      expect(label).toBe("Inspector");
      expect(text).toContain("Inspector");
      expect(text).toContain("What is in focus");
      expect(head.itemTexts).toEqual(["Inspector", ""]);
    });
  });
});
