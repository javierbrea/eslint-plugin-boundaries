import { render } from "@testing-library/react";

import { ConfirmDialog } from "./ConfirmDialog";
import { ConfirmDialogPom } from "./ConfirmDialog.pom";
import type { ConfirmDialogProps } from "./ConfirmDialog.types";

/** What a spec gets from the dialog it renders. */
type Page = {
  /** The page object of the dialog. */
  dialog: ConfirmDialogPom;
  /** The props of the dialog, with the spies of its handlers. */
  props: ConfirmDialogProps;
  /** Renders the dialog again with other props. */
  update: (changes: Partial<ConfirmDialogProps>) => void;
};

/**
 * Renders an open dialog.
 * @param changes What differs from a dialog that asks to remove a file.
 * @returns The page object of the dialog, its props and the function that updates it.
 */
function renderDialog(changes: Partial<ConfirmDialogProps> = {}): Page {
  const props: ConfirmDialogProps = {
    isOpen: true,
    title: "Remove index.js?",
    text: "Its dependencies go with it.",
    cancelLabel: "Keep it",
    confirmLabel: "Remove",
    onCancel: jest.fn(),
    onConfirm: jest.fn(),
    onExited: jest.fn(),
    ...changes,
  };
  const { rerender } = render(<ConfirmDialog {...props} />);

  return {
    dialog: new ConfirmDialogPom(),
    props,
    update: (next) => rerender(<ConfirmDialog {...props} {...next} />),
  };
}

describe("ConfirmDialog", () => {
  describe("content", () => {
    it("should ask with its title, which is also its accessible name", () => {
      // Arrange
      const { dialog } = renderDialog();

      // Act
      const { title } = dialog;
      const isNamedDialog = dialog.isDialogNamed("Remove index.js?");

      // Assert
      expect(title).toBe("Remove index.js?");
      expect(isNamedDialog).toBe(true);
    });

    it("should explain with its text", () => {
      // Arrange
      const { dialog } = renderDialog();

      // Act
      const { text } = dialog;

      // Assert
      expect(text).toBe("Its dependencies go with it.");
    });

    it("should offer the button that gives up before the one that goes on, with their labels", () => {
      // Arrange
      const { dialog } = renderDialog();

      // Act
      const { buttonTexts } = dialog;

      // Assert
      expect(buttonTexts).toEqual(["Keep it", "Remove"]);
    });

    it("should outline the button that gives up and fill the one that goes on", () => {
      // Arrange
      const { dialog } = renderDialog();

      // Act
      const giveUp = dialog.button("Keep it").variant;
      const goOn = dialog.button("Remove").variant;

      // Assert
      expect(giveUp).toBe("outlined");
      expect(goOn).toBe("contained");
    });
  });

  describe("open", () => {
    it("should be in the page while it is open", () => {
      // Arrange
      const { dialog } = renderDialog();

      // Act
      const { isRendered } = dialog;

      // Assert
      expect(isRendered).toBe(true);
    });

    it("should draw nothing while it is closed", () => {
      // Arrange
      const { dialog } = renderDialog({ isOpen: false });

      // Act
      const { isRendered } = dialog;

      // Assert
      expect(isRendered).toBe(false);
    });
  });

  describe("onCancel", () => {
    it("should be called when the button that gives up is pressed", () => {
      // Arrange
      const { dialog, props } = renderDialog();

      // Act
      dialog.button("Keep it").press();

      // Assert
      expect(props.onCancel).toHaveBeenCalledTimes(1);
      expect(props.onConfirm).not.toHaveBeenCalled();
    });

    it("should be called when Escape is pressed", () => {
      // Arrange
      const { dialog, props } = renderDialog();

      // Act
      dialog.pressEscape();

      // Assert
      expect(props.onCancel).toHaveBeenCalledTimes(1);
      expect(props.onConfirm).not.toHaveBeenCalled();
    });

    it("should be called when the backdrop around the dialog is clicked", () => {
      // Arrange
      const { dialog, props } = renderDialog();

      // Act
      dialog.clickBackdrop();

      // Assert
      expect(props.onCancel).toHaveBeenCalledTimes(1);
      expect(props.onConfirm).not.toHaveBeenCalled();
    });
  });

  describe("onConfirm", () => {
    it("should be called when the button that goes on is pressed", () => {
      // Arrange
      const { dialog, props } = renderDialog();

      // Act
      dialog.button("Remove").press();

      // Assert
      expect(props.onConfirm).toHaveBeenCalledTimes(1);
      expect(props.onCancel).not.toHaveBeenCalled();
    });
  });

  describe("onExited", () => {
    it("should not be called while the dialog is open", () => {
      // Arrange
      const { props } = renderDialog();

      // Act
      const { onExited } = props;

      // Assert
      expect(onExited).not.toHaveBeenCalled();
    });

    it("should be called once the dialog is gone after it closed", async () => {
      // Arrange
      const { dialog, props, update } = renderDialog();

      // Act
      update({ isOpen: false });
      await dialog.waitUntilGone();

      // Assert
      expect(props.onExited).toHaveBeenCalledTimes(1);
    });
  });

  describe("testId", () => {
    it("should render the test id of the component that is the dialog on its root", () => {
      // Arrange
      const { dialog } = renderDialog({ testId: "my-dialog" });

      // Act
      const { renderedTestId } = dialog;

      // Assert
      expect(renderedTestId).toBe("my-dialog");
    });

    it("should render none when it has none", () => {
      // Arrange
      const { dialog } = renderDialog();

      // Act
      const { renderedTestId } = dialog;

      // Assert
      expect(renderedTestId).toBeNull();
    });
  });
});
