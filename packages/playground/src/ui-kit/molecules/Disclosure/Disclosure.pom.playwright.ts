import type { Locator } from "@playwright/test";

import { Pom } from "@/shared/testing/pom/pom.playwright";

import { DISCLOSURE_TEST_ID } from "./Disclosure.constants";

/**
 * Writes a pattern that matches a whole text.
 * @param text The text.
 * @returns The pattern, which matches the text and nothing else.
 */
function matchWhole(text: string): RegExp {
  return new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
}

/** Page object of a disclosure, in a browser. It finds its root by the test id, and the `name` option keeps only the disclosures whose label is that text, or matches that pattern. The header is the first child of the root, and the label is the second child of the header, after the chevron. */
export class DisclosurePom extends Pom {
  protected readonly defaultTestId: string = DISCLOSURE_TEST_ID;

  /** @inheritdoc */
  protected findRoot(): Locator {
    const { name: labelName } = this.options;
    const disclosures = this.searchBase.getByTestId(
      this.options.testId ?? this.defaultTestId
    );

    if (labelName === undefined) {
      return this.pickMatch(disclosures);
    }

    return this.pickMatch(
      disclosures.filter({
        has: this.page.locator(":scope > :first-child > :nth-child(2)").filter({
          hasText:
            typeof labelName === "string" ? matchWhole(labelName) : labelName,
        }),
      })
    );
  }

  /**
   * The element that follows the label in the header, if the disclosure has a summary.
   * @returns The locator of the summary, which resolves to nothing when the disclosure has none.
   */
  private get summaryElement(): Locator {
    return this.root.locator(":scope > :first-child > :nth-child(3)");
  }

  /**
   * The text after the label, such as the path that the section `from` of the file inspector has. It reads once and does not wait.
   * @returns A promise of the text of the summary, or null when the disclosure has none or is not in the page.
   */
  get summary(): Promise<string | null> {
    return this.summaryElement.allTextContents().then(([text]) => text ?? null);
  }
}
