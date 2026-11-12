import { expect } from "@playwright/test";
import type { Locator } from "@playwright/test";

import { Pom } from "@/shared/testing/pom/pom.playwright";

import { EXAMPLE_LIST_LABEL } from "./ExamplePicker.constants";

/** Page object of the list of examples, a part of the picker: the page object of the picker builds it, so it is not exported. It is rendered in an overlay inside the root element of the playground, outside the picker, so it searches the whole page. It has no test id: it finds the element with the role `menu` that has the accessible name of the list. */
class ExampleListPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): Locator {
    return this.pickMatch(
      this.searchBase.getByRole("menu", {
        name: EXAMPLE_LIST_LABEL,
        exact: true,
      })
    );
  }

  /**
   * The names of the examples, in the order they are listed. It reads once and does not wait.
   * @returns A promise of the text of each item, which is empty when the list is not in the page.
   */
  get titles(): Promise<string[]> {
    return this.root.getByRole("menuitemradio").allTextContents();
  }

  /**
   * Picks an example.
   * @param title The name of the example, such as `Quick start`.
   */
  async pick(title: string): Promise<void> {
    await this.root
      .getByRole("menuitemradio", { name: title, exact: true })
      .click();
  }
}

/** The selector of the button: the only one of the picker that opens a menu. */
const BUTTON_SELECTOR = "button[aria-haspopup='menu']";

/** Page object of the picker of examples, in a browser, which is its button. It has no test id: it finds the button that opens a menu within its parent. */
export class ExamplePickerPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): Locator {
    return this.findRootBySelector(BUTTON_SELECTOR);
  }

  /**
   * The list of examples, which is not rendered until the button opens it.
   * @returns The page object of the list.
   */
  private get list(): ExampleListPom {
    return this.childPom(ExampleListPom, { portal: true });
  }

  /**
   * The name of the current example, which the button says after its label, the first element of the button. It reads once and does not wait.
   * @returns A promise of the name, such as `Quick start`, which is empty when the sketch is none of the examples or the button is not in the page.
   */
  get title(): Promise<string> {
    return this.root
      .evaluateAll((buttons) =>
        buttons.map((button) =>
          button.textContent
            .slice(button.firstElementChild?.textContent.length ?? 0)
            .trim()
        )
      )
      .then(([title]) => title ?? "");
  }

  /**
   * Whether the list is on screen. It reads once and does not wait.
   * @returns A promise of true when the list is in the page.
   */
  get isListOpen(): Promise<boolean> {
    return this.list.isRendered;
  }

  /**
   * The names of the examples in the list, in the order they are listed. It reads once and does not wait.
   * @returns A promise of the text of each item, which is empty while the list is not open.
   */
  get titles(): Promise<string[]> {
    return this.list.titles;
  }

  /** Presses the button, which opens the list. */
  async open(): Promise<void> {
    await this.root.click();
  }

  /**
   * Picks an example from the open list, which waits for the item to be on screen. The example replaces the sketch at once when the sketch on screen is an example or the one of the source, and after a confirmation when the user has edited it.
   * @param title The name of the example, such as `Quick start`.
   */
  async pick(title: string): Promise<void> {
    await this.list.pick(title);
  }

  /**
   * Waits for the list to be gone from the page, which MUI does when its transition ends after it closed.
   * @returns A promise that settles when the list is gone, and rejects when it is not before the timeout of the assertions.
   */
  async waitUntilClosed(): Promise<void> {
    await expect
      .poll(() => this.isListOpen, {
        message: "The list of examples is still in the page",
      })
      .toBe(false);
  }
}
