import { render } from "@testing-library/react";

import { RenameField } from "./RenameField";
import { RenameFieldPom } from "./RenameField.pom";

const PATH = "src/index.js";

const REFUSAL = "That path already exists.";

/** What a spec gets from the field it renders. */
type Page = {
  /** The page object of the field. */
  field: RenameFieldPom;
  /** The spy of `onCommit`. */
  onCommit: jest.Mock<string | undefined, [string, string]>;
  /** The spy of `onCancel`. */
  onCancel: jest.Mock<void, []>;
  /** The spy of the key presses that reach the element around the field. */
  onKeyDown: jest.Mock<void, []>;
  /** The spy of the clicks that reach the element around the field. */
  onClick: jest.Mock<void, []>;
};

/**
 * Renders the field of `src/index.js` inside an element that records the key presses and the clicks that reach it, as the row of the tree does.
 * @param refusal Why the node cannot be renamed. Every name is accepted when it is unset.
 * @returns The page object of the field and the spies.
 */
function renderField(refusal?: string): Page {
  const onCommit = jest.fn<string | undefined, [string, string]>(() => refusal);
  const onCancel = jest.fn<void, []>();
  const onKeyDown = jest.fn<void, []>();
  const onClick = jest.fn<void, []>();

  render(
    // The element stands for the row, which takes the keys and the clicks of what is inside it
    <div onKeyDown={onKeyDown} onClick={onClick}>
      <RenameField
        path={PATH}
        name="index.js"
        onCommit={onCommit}
        onCancel={onCancel}
      />
    </div>
  );

  return {
    field: new RenameFieldPom({ name: "New name of src/index.js" }),
    onCommit,
    onCancel,
    onKeyDown,
    onClick,
  };
}

describe("RenameField", () => {
  describe("field", () => {
    it("should be the text box named after the path of the node", () => {
      // Arrange
      const { field } = renderField();

      // Act
      const { isRendered } = field;

      // Assert
      expect(isRendered).toBe(true);
    });

    it("should start with the current name selected and the keyboard focus", () => {
      // Arrange
      const { field } = renderField();

      // Act
      const { value, selection, isFocused } = field;

      // Assert
      expect(value).toBe("index.js");
      expect(selection).toEqual({ start: 0, end: 8 });
      expect(isFocused).toBe(true);
    });

    it("should hold what the user types", () => {
      // Arrange
      const { field } = renderField();

      // Act
      field.type("main.js");

      // Assert
      expect(field.value).toBe("main.js");
    });
  });

  describe("when Enter is pressed", () => {
    it("should ask to rename the node with the name that was typed", () => {
      // Arrange
      const { field, onCommit, onCancel } = renderField();
      field.type("main.js");

      // Act
      field.pressKey("Enter");

      // Assert
      expect(onCommit).toHaveBeenCalledTimes(1);
      expect(onCommit).toHaveBeenCalledWith(PATH, "main.js");
      expect(onCancel).not.toHaveBeenCalled();
    });

    it("should say nothing when the name is accepted", () => {
      // Arrange
      const { field } = renderField();
      field.type("main.js");

      // Act
      field.pressKey("Enter");

      // Assert
      expect(field.refusal.isRendered).toBe(false);
      expect(field.ariaInvalid).toBe("false");
      expect(field.describedBy).toBeNull();
    });

    it("should say why the name is refused next to the field, and keep the field open", () => {
      // Arrange
      const { field, onCancel } = renderField(REFUSAL);
      field.type("Button.js");

      // Act
      field.pressKey("Enter");

      // Assert
      expect(field.refusal.text).toBe("That path already exists.");
      expect(field.ariaInvalid).toBe("true");
      expect(field.describedBy).toBe(field.refusal.id);
      expect(field.isRendered).toBe(true);
      expect(onCancel).not.toHaveBeenCalled();
    });

    it("should hide the reason when the user types again, and ask with the fixed name", () => {
      // Arrange
      const { field, onCommit } = renderField(REFUSAL);
      field.type("Button.js");
      field.pressKey("Enter");

      // Act
      field.type("Cost.js");
      const afterTyping = {
        ariaInvalid: field.ariaInvalid,
        describedBy: field.describedBy,
        nativeTitle: field.nativeTitle,
      };
      field.pressKey("Enter");

      // Assert
      expect(afterTyping).toEqual({
        ariaInvalid: "false",
        describedBy: null,
        nativeTitle: null,
      });
      expect(onCommit).toHaveBeenLastCalledWith(PATH, "Cost.js");
    });
  });

  describe("when the field loses the focus", () => {
    it("should ask to rename the node with the name that was typed", () => {
      // Arrange
      const { field, onCommit, onCancel } = renderField();
      field.type("main.js");

      // Act
      field.blur();

      // Assert
      expect(onCommit).toHaveBeenCalledTimes(1);
      expect(onCommit).toHaveBeenCalledWith(PATH, "main.js");
      expect(onCancel).not.toHaveBeenCalled();
    });

    it("should give up when the name is refused", () => {
      // Arrange
      const { field, onCommit, onCancel } = renderField(REFUSAL);
      field.type("Button.js");

      // Act
      field.blur();

      // Assert
      expect(onCommit).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("should not decide again when Enter already renamed the node", () => {
      // Arrange
      const { field, onCommit, onCancel } = renderField();
      field.type("main.js");
      field.pressKey("Enter");

      // Act
      field.blur();

      // Assert
      expect(onCommit).toHaveBeenCalledTimes(1);
      expect(onCancel).not.toHaveBeenCalled();
    });

    it("should not decide again when it already gave up", () => {
      // Arrange
      const { field, onCommit, onCancel } = renderField(REFUSAL);
      field.type("Button.js");
      field.blur();

      // Act
      field.blur();

      // Assert
      expect(onCommit).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("when Escape is pressed", () => {
    it("should give up without asking to rename the node", () => {
      // Arrange
      const { field, onCommit, onCancel } = renderField();
      field.type("main.js");

      // Act
      field.pressKey("Escape");

      // Assert
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onCommit).not.toHaveBeenCalled();
    });

    it("should not ask to rename the node when the field then loses the focus", () => {
      // Arrange
      const { field, onCommit } = renderField();
      field.type("main.js");
      field.pressKey("Escape");

      // Act
      field.blur();

      // Assert
      expect(onCommit).not.toHaveBeenCalled();
    });
  });

  describe("other keys", () => {
    it("should neither rename the node nor give up", () => {
      // Arrange
      const { field, onCommit, onCancel } = renderField();

      // Act
      field.pressKey("a");

      // Assert
      expect(onCommit).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
      expect(field.value).toBe("index.js");
    });

    it("should not reach the tree, which takes keys of its own", () => {
      // Arrange
      const { field, onKeyDown } = renderField();

      // Act
      ["a", " ", "ArrowDown", "Enter", "Escape"].forEach((key) =>
        field.pressKey(key)
      );

      // Assert
      expect(onKeyDown).not.toHaveBeenCalled();
    });
  });

  describe("clicks", () => {
    it("should not reach the row, which would select the node or toggle the folder", () => {
      // Arrange
      const { field, onClick } = renderField();

      // Act
      field.click();

      // Assert
      expect(onClick).not.toHaveBeenCalled();
    });
  });
});
