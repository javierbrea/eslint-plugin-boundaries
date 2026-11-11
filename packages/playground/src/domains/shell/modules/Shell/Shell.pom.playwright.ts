import { ShellLayoutPom } from "@/domains/shell/ui/templates/ShellLayout/ShellLayout.pom.playwright";
import { Pom } from "@/shared/testing/pom/pom.playwright";

import { SHELL_TEST_ID } from "./Shell.constants";

/** Page object of the shell, in a browser. With several shells on the page, the `index` option picks one. */
export class ShellPom extends Pom {
  protected readonly defaultTestId = SHELL_TEST_ID;

  /**
   * The layout the shell is, which has the same root element.
   * @returns The page object of the layout.
   */
  get layout(): ShellLayoutPom {
    return this.childPom(ShellLayoutPom, { root: this.root });
  }
}
