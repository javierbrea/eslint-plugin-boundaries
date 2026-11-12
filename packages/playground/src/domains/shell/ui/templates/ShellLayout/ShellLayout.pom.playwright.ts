import { Pom } from "@/shared/testing/pom/pom.playwright";

import { SHELL_LAYOUT_TEST_ID } from "./ShellLayout.constants";

/** Page object of the shell layout, in a browser. It finds its root by the test id of the layout, or by the `testId` option when a module that is the shell gives it another. */
export class ShellLayoutPom extends Pom {
  protected readonly defaultTestId: string = SHELL_LAYOUT_TEST_ID;

  /**
   * Whether assistive technology reads the layout as a region with a given name. It reads once and does not wait.
   * @param accessibleName The accessible name, which must be the whole of it.
   * @returns A promise of true when the layout is among the regions of that name of the page, whatever the parent of the page object, which a module that is the layout makes its own root.
   */
  async isRegionNamed(accessibleName: string): Promise<boolean> {
    const regions = this.page.getByRole("region", {
      name: accessibleName,
      exact: true,
    });

    return (await regions.and(this.root).count()) > 0;
  }
}
