import { waitFor } from "@testing-library/react";

import type { ProjectPanePom } from "@/domains/project/modules/ProjectPane/ProjectPane.pom";
import { ShellPom } from "@/domains/shell/modules/Shell/Shell.pom";
import type { ShellTopBarPom } from "@/domains/shell/modules/ShellTopBar/ShellTopBar.pom";
import { LoadStatePom } from "@/domains/shell/ui/atoms/LoadState/LoadState.pom";
import { SHELL_LAYOUT_LABEL } from "@/domains/shell/ui/templates/ShellLayout/ShellLayout.constants";
import { getInsertedRules } from "@/shared/testing/emittedStyle";
import { Pom } from "@/shared/testing/pom";
import { ConfirmDialogPom } from "@/ui-kit/atoms/ConfirmDialog/ConfirmDialog.pom";
import { ThemeRootPom } from "@/ui-kit/providers/ThemeRoot/ThemeRoot.pom";

import { PLAYGROUND_TEST_ID } from "./Playground.constants";

/** Page object of the playground, which is the root element that the theme gives it: it holds the shell once the sketch is loaded, and the message of the load before. It composes the page objects of those pieces and has shortcuts for what a spec does most. */
export class PlaygroundPom extends Pom {
  protected readonly defaultTestId = PLAYGROUND_TEST_ID;

  /**
   * The root element the theme makes, which has the same root element.
   * @returns The page object of the root.
   */
  get theme(): ThemeRootPom {
    return this.childPom(ThemeRootPom, { root: this.root });
  }

  /**
   * The shell, which is not rendered until the sketch is loaded.
   * @returns The page object of the shell.
   */
  get shell(): ShellPom {
    return this.childPom(ShellPom);
  }

  /**
   * The message that says why the sketch is not on screen, which is not rendered once the sketch is loaded.
   * @returns The page object of the message.
   */
  get loadState(): LoadStatePom {
    return this.childPom(LoadStatePom);
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
   * What the top bar of the shell says about the sketch.
   * @returns The text of the status, such as `6 files · 2 problems`.
   */
  get statusText(): string {
    return this.shell.topBar.bar.statusText;
  }

  /**
   * The CSS rules that the playground inserted in the document, which scope the theme to its root element. They are in the head of the page and not in the root, so they remain after the playground unmounts.
   * @returns The text of each rule, in the order they were inserted.
   */
  get insertedRules(): string[] {
    return getInsertedRules().map((rule) => rule.cssText);
  }

  /**
   * Whether a text is among the content of the playground.
   * @param text The text of an element, or a pattern it matches.
   * @returns True when an element with that text is inside the root of the playground.
   */
  holds(text: string | RegExp): boolean {
    return this.theme.holds(text);
  }

  /**
   * A dialog of the playground. MUI renders the overlays inside the root, so it is searched only there.
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
   * @returns A promise of the page object of the dialog, which settles when the dialog is on screen.
   */
  async waitForDialog(accessibleName: string): Promise<ConfirmDialogPom> {
    const dialog = this.dialog(accessibleName);

    await waitFor(() => {
      if (!dialog.isRendered) {
        throw new Error(`The dialog "${accessibleName}" is not on screen yet`);
      }
    });

    return dialog;
  }

  /**
   * Waits for the message that says that the sketch is loading.
   * @returns A promise that settles when the message is a status.
   */
  async waitUntilLoading(): Promise<void> {
    await waitFor(() => {
      if (!this.loadState.isRendered || this.loadState.role !== "status") {
        throw new Error("The sketch is not loading");
      }
    });
  }

  /**
   * Waits for the sketch to be loaded and the shell to be on screen, as the landmark that has the name of the playground.
   * @returns A promise that settles when the shell is on screen.
   */
  async waitUntilLoaded(): Promise<void> {
    await waitFor(() => {
      if (
        !this.shell.isRendered ||
        !this.shell.layout.isRegionNamed(SHELL_LAYOUT_LABEL)
      ) {
        throw new Error("The shell is not on screen yet");
      }
    });
  }

  /**
   * Waits for the top bar to say how many files the sketch has, which is how a spec tells which sketch is on screen.
   * @param text What the status starts with, such as `2 files ·`.
   * @returns A promise that settles when the status starts with that text.
   */
  async waitForStatus(text: string): Promise<void> {
    await waitFor(() => {
      const current = this.shell.isRendered ? this.statusText : "(no shell)";

      if (!current.startsWith(text)) {
        throw new Error(`The status is "${current}", not "${text}..."`);
      }
    });
  }

  /**
   * Waits for the message that says why the sketch could not be loaded.
   * @returns A promise that settles when the message is an alert.
   */
  async waitUntilFailed(): Promise<void> {
    await waitFor(() => {
      if (!this.loadState.isRendered || this.loadState.role !== "alert") {
        throw new Error("The sketch has not failed to load yet");
      }
    });
  }
}
