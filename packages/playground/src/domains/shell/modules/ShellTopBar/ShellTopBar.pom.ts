import { TopBarPom } from "@/domains/shell/ui/atoms/TopBar/TopBar.pom";
import { Pom } from "@/shared/testing/pom";

import { SHELL_TOP_BAR_TEST_ID } from "./ShellTopBar.constants";

/** Page object of the shell top bar, which is the top bar with the numbers of the store. */
export class ShellTopBarPom extends Pom {
  protected readonly defaultTestId = SHELL_TOP_BAR_TEST_ID;

  /**
   * The bar the module is, which has the same root element.
   * @returns The page object of the top bar.
   */
  get bar(): TopBarPom {
    return this.childPom(TopBarPom, { root: this.root });
  }
}
