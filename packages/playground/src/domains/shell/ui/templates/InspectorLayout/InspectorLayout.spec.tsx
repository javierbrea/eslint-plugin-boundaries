import { render } from "@testing-library/react";

import { InspectorLayout } from "./InspectorLayout";
import { InspectorLayoutPom } from "./InspectorLayout.pom";

describe("InspectorLayout", () => {
  beforeEach(() => {
    // React logs a prop that a styled part leaks to the DOM as an attribute it does not know, once for each name, so every test of the file watches for it
    jest.spyOn(console, "error").mockReturnValue(undefined);
  });

  afterEach(() => {
    const logged = [...jest.mocked(console.error).mock.calls];

    jest.mocked(console.error).mockRestore();

    if (logged.length > 0) {
      throw new Error(`React logged to the console: ${JSON.stringify(logged)}`);
    }
  });

  // React logs a leaked prop once for each name, so the test that looks for it runs before any other test of the file renders the component
  describe("props", () => {
    it("should not pass the dimmed state to the DOM", () => {
      // Arrange
      render(<InspectorLayout dimmed>What is in focus</InspectorLayout>);

      // Act
      const logged = jest.mocked(console.error).mock.calls;

      // Assert
      expect(logged).toEqual([]);
    });
  });

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

  describe("dimmed", () => {
    it("should show the content in full when it is not told that it is out of date", () => {
      // Arrange
      render(<InspectorLayout>What is in focus</InspectorLayout>);
      const layout = new InspectorLayoutPom();

      // Act
      const { contentOpacity } = layout;

      // Assert
      expect(contentOpacity).toBe("1");
    });

    it("should fade the content while it is out of date, and show it in full when it is up to date again", () => {
      // Arrange
      const { rerender } = render(
        <InspectorLayout dimmed>What is in focus</InspectorLayout>
      );
      const layout = new InspectorLayoutPom();
      const whileOutOfDate = layout.contentOpacity;

      // Act
      rerender(
        <InspectorLayout dimmed={false}>What is in focus</InspectorLayout>
      );

      // Assert
      expect(whileOutOfDate).toBe("0.5");
      expect(layout.contentOpacity).toBe("1");
    });
  });

  describe("content", () => {
    it("should keep each part at the height of what it holds, so that the content scrolls instead of cutting it", () => {
      // Arrange
      render(<InspectorLayout>What is in focus</InspectorLayout>);
      const layout = new InspectorLayoutPom();

      // Act
      const { contentRowSizing } = layout;

      // Assert
      expect(contentRowSizing).toBe("max-content");
    });
  });
});
