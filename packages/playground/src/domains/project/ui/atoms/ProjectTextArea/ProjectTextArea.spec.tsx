import { render } from "@testing-library/react";

import { ProjectTextArea } from "./ProjectTextArea";
import { ProjectTextAreaPom } from "./ProjectTextArea.pom";
import type { ProjectTextAreaProps } from "./ProjectTextArea.types";

const TEXT = "eslint.config.js\nsrc/index.js\n";

/** What a spec gets from the textarea it renders. */
type Page = {
  /** The page object of the textarea. */
  area: ProjectTextAreaPom;
  /** The props of the textarea, with the spies of its handlers. */
  props: ProjectTextAreaProps;
};

/**
 * Renders the textarea.
 * @param changes What differs from an editable textarea that shows the text of a small sketch.
 * @returns The page object of the textarea and its props.
 */
function renderArea(changes: Partial<ProjectTextAreaProps> = {}): Page {
  const props: ProjectTextAreaProps = {
    value: TEXT,
    readOnly: false,
    onChange: jest.fn(),
    onBlur: jest.fn(),
    ...changes,
  };

  render(<ProjectTextArea {...props} />);

  return { area: new ProjectTextAreaPom({ name: "Project as text" }), props };
}

describe("ProjectTextArea", () => {
  describe("textarea", () => {
    it("should be the text box named Project as text", () => {
      // Arrange
      const { area } = renderArea();

      // Act
      const { isRendered, label, tagName } = area;

      // Assert
      expect(isRendered).toBe(true);
      expect(label).toBe("Project as text");
      expect(tagName).toBe("TEXTAREA");
    });

    it("should show the text it is given", () => {
      // Arrange
      const { area } = renderArea();

      // Act
      const { value } = area;

      // Assert
      expect(value).toBe("eslint.config.js\nsrc/index.js\n");
    });

    it("should not let the browser correct or wrap the paths", () => {
      // Arrange
      const { area } = renderArea();

      // Act
      const { spellcheck, wrap, autocapitalize, autocomplete, autocorrect } =
        area;

      // Assert
      expect(spellcheck).toBe("false");
      expect(wrap).toBe("off");
      expect(autocapitalize).toBe("off");
      expect(autocomplete).toBe("off");
      expect(autocorrect).toBe("off");
    });
  });

  describe("readOnly", () => {
    it("should draw a read only text when it is set", () => {
      // Arrange
      const { area } = renderArea({ readOnly: true });

      // Act
      const { isReadOnly } = area;

      // Assert
      expect(isReadOnly).toBe(true);
    });

    it("should be editable otherwise", () => {
      // Arrange
      const { area } = renderArea({ readOnly: false });

      // Act
      const { isReadOnly } = area;

      // Assert
      expect(isReadOnly).toBe(false);
    });
  });

  describe("testId", () => {
    it("should render the test id it is given", () => {
      // Arrange
      const { area } = renderArea({ testId: "project-text" });

      // Act
      const { renderedTestId } = area;

      // Assert
      expect(renderedTestId).toBe("project-text");
    });

    it("should render none otherwise", () => {
      // Arrange
      const { area } = renderArea();

      // Act
      const { renderedTestId } = area;

      // Assert
      expect(renderedTestId).toBeNull();
    });
  });

  describe("when the user types", () => {
    it("should call onChange with the whole text", () => {
      // Arrange
      const { area, props } = renderArea();

      // Act
      area.type("src/index.js\nsrc/new.js");

      // Assert
      expect(props.onChange).toHaveBeenCalledTimes(1);
      expect(props.onChange).toHaveBeenCalledWith("src/index.js\nsrc/new.js");
    });

    it("should keep showing the value it is given until it is given another", () => {
      // Arrange
      const { area } = renderArea();

      // Act
      area.type("src/index.js\nsrc/new.js");

      // Assert
      expect(area.value).toBe("eslint.config.js\nsrc/index.js\n");
    });
  });

  describe("when it loses the focus", () => {
    it("should call onBlur", () => {
      // Arrange
      const { area, props } = renderArea();

      // Act
      area.blur();

      // Assert
      expect(props.onBlur).toHaveBeenCalledTimes(1);
      expect(props.onChange).not.toHaveBeenCalled();
    });
  });
});
