import { PlaygroundPom, Pom } from "@boundaries/playground/playwright";
import { expect } from "@playwright/test";
import type { Locator } from "@playwright/test";

import {
  PLAYGROUND_PAGE_LOADING_TEST_ID,
  PLAYGROUND_PAGE_NOTE_TEST_ID,
} from "./playground.constants";

/** Page object of the page at `/playground/`, in a browser: the `main` landmark of the page, which holds the desktop-only note, the loading box and, on wide screens, the playground. The page has no jsdom sibling, so `check:pom-parity` does not compare it. */
export class PlaygroundPagePom extends Pom {
  protected readonly defaultTestId = "";

  /**
   * Finds the root as the `main` landmark, the only one the page has, so that the markup of the site holds no test id for it.
   * @returns The locator of the root element.
   */
  protected findRoot(): Locator {
    return this.pickMatch(this.searchBase.getByRole("main"));
  }

  /**
   * The playground of the page, which is rendered on wide screens only and is not rendered until its chunk arrives.
   * @returns The page object of the playground.
   */
  get playground(): PlaygroundPom {
    return this.childPom(PlaygroundPom);
  }

  /**
   * The note that says the playground needs a wider screen. The page renders it at every width and hides it with CSS from 997 px up.
   * @returns The locator of the note.
   */
  private get note(): Locator {
    return this.root.getByTestId(PLAYGROUND_PAGE_NOTE_TEST_ID);
  }

  /**
   * The box that holds the place of the playground while it loads. The server render and the first render of the browser show it, and the browser removes it once the page has hydrated, on narrow screens, or once the playground has arrived, on wide ones. CSS hides it on narrow screens.
   * @returns The locator of the loading box.
   */
  private get loadingBox(): Locator {
    return this.root.getByTestId(PLAYGROUND_PAGE_LOADING_TEST_ID);
  }

  /**
   * Whether the note is on screen, which depends on the width of the viewport. It reads once and does not wait.
   * @returns A promise of true when the note is visible.
   */
  get isNoteVisible(): Promise<boolean> {
    return this.note.isVisible();
  }

  /**
   * The text of the note, whether or not it is visible. It reads once and does not wait.
   * @returns A promise of the text, or null when the page has no note.
   */
  get noteText(): Promise<string | null> {
    return this.note
      .allTextContents()
      .then((texts) => (texts.length > 0 ? texts[0].trim() : null));
  }

  /**
   * Whether the loading box is on screen. It reads once and does not wait.
   * @returns A promise of true when the box is visible.
   */
  get isLoadingBoxVisible(): Promise<boolean> {
    return this.loadingBox.isVisible();
  }

  /**
   * Waits for the note to be on screen, which is how a narrow viewport shows the page.
   * @returns A promise that settles when the note is visible, and rejects when it is not before the timeout of the assertions.
   */
  async waitForNote(): Promise<void> {
    await expect(this.note).toBeVisible();
  }

  /**
   * Waits for the note to be out of sight, which is how a wide viewport shows the page.
   * @returns A promise that settles when the note is hidden, and rejects when it is not before the timeout of the assertions.
   */
  async waitUntilNoteHidden(): Promise<void> {
    await expect(this.note).toBeHidden();
  }

  /**
   * Waits for the loading box to leave the page, which means that the browser has hydrated it. On a wide screen it also means that the chunk of the playground has arrived, so the playground is rendered, though it may still be loading its sketch. On a narrow screen the playground never renders.
   * @returns A promise that settles when the page has no loading box, and rejects when it still has one before the timeout of the assertions.
   */
  async waitUntilLoadingBoxGone(): Promise<void> {
    await expect(this.loadingBox).toHaveCount(0);
  }
}
