import { render } from "@testing-library/react";

import { ProjectFoot } from "./ProjectFoot";
import { ProjectFootPom } from "./ProjectFoot.pom";
import type { ProjectFootProps } from "./ProjectFoot.types";

/** What a spec gets from the foot it renders. */
type Page = {
  /** The page object of the foot. */
  foot: ProjectFootPom;
  /** The props of the foot, with the spies of its handlers. */
  props: ProjectFootProps;
  /** Renders the foot again with other props. */
  update: (changes: Partial<ProjectFootProps>) => void;
};

/**
 * Renders the foot.
 * @param changes What differs from the foot of a project shown as a tree, whose nodes can be added.
 * @returns The page object of the foot, its props and the function that updates it.
 */
function renderFoot(changes: Partial<ProjectFootProps> = {}): Page {
  const props: ProjectFootProps = {
    view: "tree",
    editable: true,
    onAdd: jest.fn(),
    onViewChange: jest.fn(),
    ...changes,
  };
  const { rerender } = render(<ProjectFoot {...props} />);

  return {
    foot: new ProjectFootPom(),
    props,
    update: (next) => rerender(<ProjectFoot {...props} {...next} />),
  };
}

describe("ProjectFoot", () => {
  describe("editable", () => {
    it("should offer to add a file and a folder before the toggle of the view", () => {
      // Arrange
      const { foot } = renderFoot();

      // Act
      const { buttonTexts, buttonNames } = foot;

      // Assert
      expect(buttonTexts).toEqual(["File", "Folder", "Tree", "Text"]);
      expect(buttonNames).toEqual(["Add file", "Add folder", "Tree", "Text"]);
    });

    it("should offer only the toggle of the view when nodes cannot be added", () => {
      // Arrange
      const { foot } = renderFoot({ editable: false });

      // Act
      const { buttonTexts, buttonNames } = foot;

      // Assert
      expect(buttonTexts).toEqual(["Tree", "Text"]);
      expect(buttonNames).toEqual(["Tree", "Text"]);
    });
  });

  describe("onAdd", () => {
    it("should be called with file when the button that adds a file is pressed", () => {
      // Arrange
      const { foot, props } = renderFoot();

      // Act
      foot.addFile();

      // Assert
      expect(props.onAdd).toHaveBeenCalledTimes(1);
      expect(props.onAdd).toHaveBeenCalledWith("file");
    });

    it("should be called with folder when the button that adds a folder is pressed", () => {
      // Arrange
      const { foot, props } = renderFoot();

      // Act
      foot.addFolder();

      // Assert
      expect(props.onAdd).toHaveBeenCalledTimes(1);
      expect(props.onAdd).toHaveBeenCalledWith("folder");
    });
  });

  describe("view", () => {
    it("should name the toggle of the view", () => {
      // Arrange
      const { foot } = renderFoot();

      // Act
      const { viewName } = foot;

      // Assert
      expect(viewName).toBe("Project view");
    });

    it("should offer the tree and the text, with the current view pressed", () => {
      // Arrange
      const { foot, update } = renderFoot({ view: "text" });
      const inText = foot.views;

      // Act
      update({ view: "tree" });
      const inTree = foot.views;

      // Assert
      expect(inText).toEqual([
        { text: "Tree", pressed: "false" },
        { text: "Text", pressed: "true" },
      ]);
      expect(inTree).toEqual([
        { text: "Tree", pressed: "true" },
        { text: "Text", pressed: "false" },
      ]);
    });
  });

  describe("onViewChange", () => {
    it("should be called with the view of the button that is pressed", () => {
      // Arrange
      const { foot, props } = renderFoot();

      // Act
      foot.pressView("Text");

      // Assert
      expect(props.onViewChange).toHaveBeenCalledTimes(1);
      expect(props.onViewChange).toHaveBeenCalledWith("text");
    });

    it("should be called with tree when the project is shown as text and Tree is pressed", () => {
      // Arrange
      const { foot, props } = renderFoot({ view: "text" });

      // Act
      foot.pressView("Tree");

      // Assert
      expect(props.onViewChange).toHaveBeenCalledWith("tree");
    });

    it("should not be called when the current view is pressed again", () => {
      // Arrange
      const { foot, props } = renderFoot();

      // Act
      foot.pressView("Tree");

      // Assert
      expect(props.onViewChange).not.toHaveBeenCalled();
    });
  });
});
