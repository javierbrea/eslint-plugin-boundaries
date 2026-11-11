import { expect } from "@playwright/test";

import type { ProjectPanePom } from "@/domains/project/modules/ProjectPane/ProjectPane.pom.playwright";
import { ShellPom } from "@/domains/shell/modules/Shell/Shell.pom.playwright";
import type { ShellTopBarPom } from "@/domains/shell/modules/ShellTopBar/ShellTopBar.pom.playwright";
import { SHELL_LAYOUT_LABEL } from "@/domains/shell/ui/templates/ShellLayout/ShellLayout.constants";
import { Pom } from "@/shared/testing/pom/pom.playwright";
import { ConfirmDialogPom } from "@/ui-kit/atoms/ConfirmDialog/ConfirmDialog.pom.playwright";

import { PLAYGROUND_TEST_ID } from "./Playground.constants";

/** Page object of the playground, in a browser: the root element that the theme gives it, which holds the shell once the sketch is loaded. It composes the page objects of those pieces and has shortcuts for what a spec does most. */
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
   * The top bar of the shell, with the picker of examples and the actions.
   * @returns The page object of the top bar.
   */
  get topBar(): ShellTopBarPom {
    return this.shell.topBar;
  }

  /**
   * The project pane of the shell.
   * @returns The page object of the pane.
   */
  get project(): ProjectPanePom {
    return this.shell.project;
  }

  /**
   * What the top bar of the shell says about the sketch. It reads once and does not wait.
   * @returns A promise of the text of the status, such as `6 files · 9 dependencies · 2 problems`, which is empty while the shell is not on screen.
   */
  get statusText(): Promise<string> {
    return this.shell.topBar.bar.statusText;
  }

  /**
   * A dialog of the playground, such as the one that asks before the sketch is replaced. MUI renders the overlays inside the root, so it is searched only there.
   * @param accessibleName The accessible name of the dialog, such as its title. Any dialog when it is unset.
   * @returns The page object of the dialog, which is not rendered until something asks for it.
   */
  dialog(accessibleName?: string): ConfirmDialogPom {
    return this.childPom(
      ConfirmDialogPom,
      accessibleName === undefined ? {} : { name: accessibleName }
    );
  }

  /**
   * Waits for a dialog of the playground to be on screen, such as the one that asks before the sketch is replaced.
   * @param accessibleName The accessible name of the dialog, such as its title.
   * @returns A promise of the page object of the dialog, which settles when the dialog is on screen, and rejects when it is not before the timeout of the assertions.
   */
  async waitForDialog(accessibleName: string): Promise<ConfirmDialogPom> {
    const dialog = this.dialog(accessibleName);

    await expect
      .poll(() => dialog.isRendered, {
        message: `The dialog "${accessibleName}" is not on screen yet`,
      })
      .toBe(true);

    return dialog;
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

  /**
   * Waits for the top bar to say how many files the sketch has, which is how a spec tells which sketch is on screen.
   * @param text What the status starts with, such as `2 files ·`.
   * @returns A promise that settles when the status starts with that text, and rejects, with what it says, when it does not before the timeout of the assertions.
   */
  async waitForStatus(text: string): Promise<void> {
    await expect
      .poll(async () => (await this.statusText).slice(0, text.length), {
        message: "The status of the top bar does not start with the text",
      })
      .toBe(text);
  }
}
