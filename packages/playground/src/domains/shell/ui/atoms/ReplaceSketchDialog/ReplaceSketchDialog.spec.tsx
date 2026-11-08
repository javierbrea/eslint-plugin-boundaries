import { render } from "@testing-library/react";

import { ReplaceSketchDialog } from "./ReplaceSketchDialog";
import { ReplaceSketchDialogPom } from "./ReplaceSketchDialog.pom";
import type { ReplaceSketchDialogProps } from "./ReplaceSketchDialog.types";

/** What a spec gets from the dialog it renders. */
type Page = {
  /** The page object of the dialog. */
  dialog: ReplaceSketchDialogPom;
  /** The props of the dialog, with the spies of its handlers. */
  props: ReplaceSketchDialogProps;
};

/**
 * Renders the dialog.
 * @param changes What differs from an open dialog that asks about a reset.
 * @returns The page object of the dialog and its props.
 */
function renderDialog(changes: Partial<ReplaceSketchDialogProps> = {}): Page {
  const props: ReplaceSketchDialogProps = {
    isOpen: true,
    replacement: { kind: "reset" },
    onCancel: jest.fn(),
    onConfirm: jest.fn(),
    ...changes,
  };

  render(<ReplaceSketchDialog {...props} />);

  return { dialog: new ReplaceSketchDialogPom(), props };
}

describe("ReplaceSketchDialog", () => {
  describe("when the sketch would be reset", () => {
    it("should ask whether to reset the sketch, and name the dialog by it", () => {
      // Arrange
      const { dialog } = renderDialog({ replacement: { kind: "reset" } });

      // Act
      const { title } = dialog.dialog;
      const isNamedDialog = dialog.dialog.isDialogNamed("Reset the sketch?");

      // Assert
      expect(title).toBe("Reset the sketch?");
      expect(isNamedDialog).toBe(true);
    });

    it("should say that the changes are lost, and offer to cancel or to reset", () => {
      // Arrange
      const { dialog } = renderDialog({ replacement: { kind: "reset" } });

      // Act
      const { text, buttonTexts } = dialog.dialog;

      // Assert
      expect(text).toBe("Your changes to the sketch are lost.");
      expect(buttonTexts).toEqual(["Cancel", "Reset"]);
    });
  });

  describe("when an example would take its place", () => {
    it("should ask whether to open the example, by its title", () => {
      // Arrange
      const { dialog } = renderDialog({
        replacement: { kind: "example", title: "Policies" },
      });

      // Act
      const { title } = dialog.dialog;

      // Assert
      expect(title).toBe("Open the Policies example?");
    });

    it("should say that the changes are lost, and offer to cancel or to open the example", () => {
      // Arrange
      const { dialog } = renderDialog({
        replacement: { kind: "example", title: "Policies" },
      });

      // Act
      const { text, buttonTexts } = dialog.dialog;

      // Assert
      expect(text).toBe("Your changes to the sketch are lost.");
      expect(buttonTexts).toEqual(["Cancel", "Open example"]);
    });
  });

  describe("open", () => {
    it("should draw nothing while it is closed", () => {
      // Arrange
      const { dialog } = renderDialog({ isOpen: false });

      // Act
      const { isRendered } = dialog;

      // Assert
      expect(isRendered).toBe(false);
    });
  });

  describe("handlers", () => {
    it("should go on when the user confirms, and not give up", () => {
      // Arrange
      const { dialog, props } = renderDialog();

      // Act
      dialog.confirm("Reset");

      // Assert
      expect(props.onConfirm).toHaveBeenCalledTimes(1);
      expect(props.onCancel).not.toHaveBeenCalled();
    });

    it("should give up when the user cancels, and not go on", () => {
      // Arrange
      const { dialog, props } = renderDialog();

      // Act
      dialog.cancel();

      // Assert
      expect(props.onCancel).toHaveBeenCalledTimes(1);
      expect(props.onConfirm).not.toHaveBeenCalled();
    });

    it("should give up with the Escape key", () => {
      // Arrange
      const { dialog, props } = renderDialog();

      // Act
      dialog.dialog.pressEscape();

      // Assert
      expect(props.onCancel).toHaveBeenCalledTimes(1);
    });
  });
});
