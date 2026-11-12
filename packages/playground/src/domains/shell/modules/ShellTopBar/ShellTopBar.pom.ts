import { ExamplePickerPom } from "@/domains/examples/ui/atoms/ExamplePicker/ExamplePicker.pom";
import { ShareDialogPom } from "@/domains/share/ui/molecules/ShareDialog/ShareDialog.pom";
import { HELP_DIALOG_TITLE } from "@/domains/shell/ui/atoms/HelpDialog/HelpDialog.constants";
import { HelpDialogPom } from "@/domains/shell/ui/atoms/HelpDialog/HelpDialog.pom";
import { TopBarActionsPom } from "@/domains/shell/ui/molecules/TopBarActions/TopBarActions.pom";
import { TopBarPom } from "@/domains/shell/ui/templates/TopBar/TopBar.pom";
import { Pom } from "@/shared/testing/pom";

import { SHELL_TOP_BAR_TEST_ID } from "./ShellTopBar.constants";

/** Page object of the shell top bar, which is the top bar with the numbers of the store, the picker of examples, and Help, Reset and Share, and the dialogs that Help and Share open. */
export class ShellTopBarPom extends Pom {
  protected readonly defaultTestId = SHELL_TOP_BAR_TEST_ID;

  /**
   * The bar the module is, which has the same root element.
   * @returns The page object of the top bar.
   */
  get bar(): TopBarPom {
    return this.childPom(TopBarPom, { root: this.root });
  }

  /**
   * The picker of examples, which is not rendered when the sketch cannot be replaced.
   * @returns The page object of the picker.
   */
  get picker(): ExamplePickerPom {
    return this.childPom(ExamplePickerPom);
  }

  /**
   * Help, Reset and Share, and the live region that tells that the link was copied.
   * @returns The page object of the actions.
   */
  get actions(): TopBarActionsPom {
    return this.childPom(TopBarActionsPom);
  }

  /**
   * The help dialog, which is rendered in an overlay outside the bar and not until Help opens it. It is found by its title, so that another dialog, such as the confirmation of Reset, is not taken for it.
   * @returns The page object of the dialog.
   */
  get help(): HelpDialogPom {
    return this.childPom(HelpDialogPom, {
      portal: true,
      name: HELP_DIALOG_TITLE,
    });
  }

  /**
   * The dialog of a share notice, which is rendered in an overlay outside the bar and not until a share has something to tell besides a link that was copied.
   * @returns The page object of the dialog.
   */
  get shareDialog(): ShareDialogPom {
    return this.childPom(ShareDialogPom, { portal: true });
  }
}
