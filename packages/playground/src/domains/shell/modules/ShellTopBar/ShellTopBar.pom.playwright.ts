import { ExamplePickerPom } from "@/domains/examples/ui/atoms/ExamplePicker/ExamplePicker.pom.playwright";
import { HelpDialogPom } from "@/domains/shell/ui/atoms/HelpDialog/HelpDialog.pom.playwright";
import { TopBarActionsPom } from "@/domains/shell/ui/molecules/TopBarActions/TopBarActions.pom.playwright";
import { TopBarPom } from "@/domains/shell/ui/templates/TopBar/TopBar.pom.playwright";
import { Pom } from "@/shared/testing/pom/pom.playwright";

import { SHELL_TOP_BAR_TEST_ID } from "./ShellTopBar.constants";

/** Page object of the shell top bar, in a browser, which is the top bar with the numbers of the store, the picker of examples, and Help, Reset and Share, and the dialog that Help opens. */
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
   * Help, Reset and Share.
   * @returns The page object of the actions.
   */
  get actions(): TopBarActionsPom {
    return this.childPom(TopBarActionsPom);
  }

  /**
   * The help dialog, which is rendered in an overlay outside the bar and not until Help opens it.
   * @returns The page object of the dialog.
   */
  get help(): HelpDialogPom {
    return this.childPom(HelpDialogPom, { portal: true });
  }
}
