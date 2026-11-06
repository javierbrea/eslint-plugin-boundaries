import { waitFor } from "@testing-library/react";

import { DependencyPickerPom } from "@/domains/files/ui/molecules/DependencyPicker/DependencyPicker.pom";

/** Page object of the dialog that adds and edits a dependency of the store. It is the picker, which has the same root element, and it waits for the dialog to be gone once the user confirmed or gave up. */
export class DependencyPickerDialogPom extends DependencyPickerPom {
  /**
   * Waits for the dialog to be gone from the page, which MUI does when its transition ends after it closed.
   * @returns A promise that settles when the dialog is gone.
   */
  async waitUntilGone(): Promise<void> {
    await waitFor(() => {
      if (this.isRendered) {
        throw new Error("The dialog is still in the page");
      }
    });
  }
}
