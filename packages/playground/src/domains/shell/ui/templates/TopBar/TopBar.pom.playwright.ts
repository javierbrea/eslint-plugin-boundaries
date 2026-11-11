import { expect } from "@playwright/test";
import type { Locator } from "@playwright/test";

import { Pom } from "@/shared/testing/pom/pom.playwright";

import { TOP_BAR_TEST_ID } from "./TopBar.constants";

/** What the text of the status starts with: the number of files. */
const STATUS_PATTERN = /^\d+ files? ·/;

/** What the text of the status is once the problems are counted: the numbers of the project, with how many problems it has. Any other end, such as `evaluating…` or `config has errors`, is not a count. */
const COUNTED_STATUS_PATTERN =
  /^\d+ files? · \d+ (?:dependency|dependencies) · \d+ problems?$/;

/** Page object of the top bar, in a browser. It finds its root by the test id of the bar, or by the `testId` option when a component that is the bar gives it another. A component that is the bar can also give it its root with the `root` option. */
export class TopBarPom extends Pom {
  protected readonly defaultTestId: string = TOP_BAR_TEST_ID;

  /**
   * The element of the text of the status, which holds the number of files and the count of problems.
   * @returns The locator of the element.
   */
  private get label(): Locator {
    return this.root.getByText(STATUS_PATTERN).first();
  }

  /**
   * Everything the status says. It reads once and does not wait.
   * @returns A promise of the text of the status, such as `6 files · 9 dependencies · 2 problems`, or an empty string while the bar is not in the page.
   */
  get statusText(): Promise<string> {
    return this.readText(this.label);
  }

  // pom-parity: the evaluation runs in a web worker, so only a browser sees a project on screen whose verdicts have not arrived yet; jsdom answers before a spec reads
  /**
   * Waits until the evaluation of the project on screen has arrived and the status counts its problems: `N files · N dependencies · N problems`. Until then the status has no end, before the first evaluation arrives, or reads `evaluating…` once it is 400 ms late.
   *
   * A project that replaces the one on screen, such as an example, Reset or a link, mounts a new shell that counts no problems until its first evaluation, so this waits for the evaluation of the new project. An edit inside the shell is different: the status keeps the count of the last evaluation until the evaluation of the edit arrives, so after an edit wait for the exact status that it must produce, with `expect.poll` over `statusText`.
   * @returns A promise that settles when the status counts the problems, and rejects, with the status it has, when it does not before the timeout of the assertions: an evaluation that is stopped or failed, or a config with errors, never counts them.
   */
  async waitUntilEvaluated(): Promise<void> {
    await expect
      .poll(() => this.statusText, {
        message: "The evaluation of the project has not settled",
      })
      .toMatch(COUNTED_STATUS_PATTERN);
  }
}
