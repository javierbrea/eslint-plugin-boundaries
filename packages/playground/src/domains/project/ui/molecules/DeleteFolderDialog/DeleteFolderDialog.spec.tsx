import { render } from "@testing-library/react";

import { DeleteFolderDialog } from "./DeleteFolderDialog";
import { DeleteFolderDialogPom } from "./DeleteFolderDialog.pom";
import type { DeleteFolderDialogProps } from "./DeleteFolderDialog.types";

/** What a spec gets from the dialog it renders. */
type Page = {
  /** The page object of the dialog. */
  dialog: DeleteFolderDialogPom;
  /** The props of the dialog, with the spies of its handlers. */
  props: DeleteFolderDialogProps;
  /** Renders the dialog again with other props. */
  update: (changes: Partial<DeleteFolderDialogProps>) => void;
};

/**
 * Renders the dialog.
 * @param changes What differs from an open dialog that asks about `src` and its 3 files.
 * @returns The page object of the dialog, its props and the function that updates it.
 */
function renderDialog(changes: Partial<DeleteFolderDialogProps> = {}): Page {
  const props: DeleteFolderDialogProps = {
    isOpen: true,
    path: "src",
    files: 3,
    onCancel: jest.fn(),
    onConfirm: jest.fn(),
    onExited: jest.fn(),
    ...changes,
  };
  const { rerender } = render(<DeleteFolderDialog {...props} />);

  return {
    dialog: new DeleteFolderDialogPom(),
    props,
    update: (next) => rerender(<DeleteFolderDialog {...props} {...next} />),
  };
}

describe("DeleteFolderDialog", () => {
  describe("title", () => {
    it("should name the folder with a slash, and count its files", () => {
      // Arrange
      const { dialog } = renderDialog();

      // Act
      const { title } = dialog.dialog;

      // Assert
      expect(title).toBe("Delete src/ and its 3 files?");
    });

    it("should say file, not files, for a folder with one", () => {
      // Arrange
      const { dialog } = renderDialog({ path: "docs", files: 1 });

      // Act
      const { title } = dialog.dialog;

      // Assert
      expect(title).toBe("Delete docs/ and its 1 file?");
    });

    it("should name the dialog by its title", () => {
      // Arrange
      const { dialog } = renderDialog({ path: "src/components", files: 2 });

      // Act
      const { title, titleId, labelledBy } = dialog.dialog;

      // Assert
      expect(title).toBe("Delete src/components/ and its 2 files?");
      expect(labelledBy).toBe(titleId);
    });
  });

  describe("content", () => {
    it("should say that the dependencies of the files go with them", () => {
      // Arrange
      const { dialog } = renderDialog();

      // Act
      const { text } = dialog.dialog;

      // Assert
      expect(text).toBe(
        "The dependencies of these files, and the ones that point to them, go with them."
      );
    });

    it("should offer to cancel and to delete", () => {
      // Arrange
      const { dialog } = renderDialog();

      // Act
      const { buttonTexts } = dialog.dialog;

      // Assert
      expect(buttonTexts).toEqual(["Cancel", "Delete"]);
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
    it("should call onCancel when Cancel is pressed", () => {
      // Arrange
      const { dialog, props } = renderDialog();

      // Act
      dialog.dialog.button("Cancel").press();

      // Assert
      expect(props.onCancel).toHaveBeenCalledTimes(1);
      expect(props.onConfirm).not.toHaveBeenCalled();
    });

    it("should call onConfirm when Delete is pressed", () => {
      // Arrange
      const { dialog, props } = renderDialog();

      // Act
      dialog.dialog.button("Delete").press();

      // Assert
      expect(props.onConfirm).toHaveBeenCalledTimes(1);
      expect(props.onCancel).not.toHaveBeenCalled();
    });

    it("should call onExited once the dialog is gone after it closed", async () => {
      // Arrange
      const { dialog, props, update } = renderDialog();

      // Act
      update({ isOpen: false });
      await dialog.dialog.waitUntilGone();

      // Assert
      expect(props.onExited).toHaveBeenCalledTimes(1);
    });
  });
});
