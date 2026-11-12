import { Pom } from "@/shared/testing/pom";
import { ConfirmDialogPom } from "@/ui-kit/atoms/ConfirmDialog/ConfirmDialog.pom";

/** Page object of the dialog that asks before the sketch is replaced. It has no test id: it finds the element with the role `dialog` within its parent, as the confirmation dialog it is made of does. It is rendered in an overlay, outside the element that opened it, so build it without a parent, or with the `portal` option. */
export class ReplaceSketchDialogPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.pickMatch(
      this.searchBase.queryAllByRole("dialog"),
      'the role "dialog"'
    );
  }

  /**
   * The confirmation dialog it is made of: its title, its text and its buttons.
   * @returns The page object of the dialog.
   */
  get dialog(): ConfirmDialogPom {
    return this.childPom(ConfirmDialogPom, { root: this.root });
  }

  /**
   * Presses the button that goes on, whatever it says: it is the second button of the dialog.
   * @param label The label of the button, such as `Reset` or `Open example`.
   */
  confirm(label: string): void {
    this.dialog.button(label).press();
  }

  /** Presses the button that gives up. */
  cancel(): void {
    this.dialog.button("Cancel").press();
  }
}
