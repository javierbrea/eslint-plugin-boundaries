import { expect } from "@playwright/test";

import { ShellPom } from "@/domains/shell/modules/Shell/Shell.pom.playwright";
import { SHELL_LAYOUT_LABEL } from "@/domains/shell/ui/templates/ShellLayout/ShellLayout.constants";
import { Pom } from "@/shared/testing/pom/pom.playwright";

import { PLAYGROUND_TEST_ID } from "./Playground.constants";

/** Page object of the playground, in a browser: the root element that the theme gives it, which holds the shell once the sketch is loaded. */
export class PlaygroundPom extends Pom {
  protected readonly defaultTestId = PLAYGROUND_TEST_ID;

  /**
   * The shell, which is not rendered until the sketch is loaded.
   * @returns The page object of the shell.
   */
  get shell(): ShellPom {
    return this.childPom(ShellPom);
  }

  /**
   * Waits for the sketch to be loaded and the shell to be on screen, as the landmark that has the name of the playground.
   * @returns A promise that settles when the shell is on screen, and rejects when it is not before the timeout of the assertions.
   */
  async waitUntilLoaded(): Promise<void> {
    await expect
      .poll(
        async () =>
          (await this.shell.isRendered) &&
          (await this.shell.layout.isRegionNamed(SHELL_LAYOUT_LABEL)),
        { message: "The shell is not on screen yet" }
      )
      .toBe(true);
  }
}
