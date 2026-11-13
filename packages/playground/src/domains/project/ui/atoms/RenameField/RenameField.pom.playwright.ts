import type { Locator } from "@playwright/test";

import { Pom } from "@/shared/testing/pom/pom.playwright";

/** Page object of the tooltip that says why a name is refused, a part of the field, exported only as a type. No browser spec reaches it: it exists because the jsdom page object exports a class of this name, which `check:pom-parity` requires of this file too. */
class RefusalPom extends Pom {
  protected readonly defaultTestId = "";
}

/** Page object of the field that renames a node, in a browser. It has no test id: it finds the text box named after the node, so the `name` option is `New name of` followed by the path, or the first text box within its parent when there is none. */
export class RenameFieldPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): Locator {
    const { name: accessibleName } = this.options;

    return this.pickMatch(
      this.searchBase.getByRole(
        "textbox",
        accessibleName === undefined ? {} : { name: accessibleName }
      )
    );
  }

  /**
   * Whether the field has the keyboard focus. It reads once and does not wait.
   * @returns A promise of true when the input is the active element of the page, and of false when the field is not in the page.
   */
  get isFocused(): Promise<boolean> {
    return this.root
      .evaluateAll((inputs) =>
        inputs.map((input) => input === document.activeElement)
      )
      .then(([isFocused]) => isFocused ?? false);
  }

  /**
   * Types a name in the field, in place of what it holds, which waits for the field to be on screen.
   * @param text The new value.
   */
  async type(text: string): Promise<void> {
    await this.root.fill(text);
  }

  /**
   * Presses a key in the field.
   * @param key The key, such as `Enter` or `Escape`.
   */
  async pressKey(key: string): Promise<void> {
    await this.root.press(key);
  }
}

export type { RefusalPom };
