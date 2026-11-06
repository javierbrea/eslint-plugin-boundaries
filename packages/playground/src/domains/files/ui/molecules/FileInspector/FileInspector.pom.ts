import { VerdictCountPom } from "@/domains/evaluation/ui/atoms/VerdictCount/VerdictCount.pom";
import { Pom } from "@/shared/testing/pom";
import { SectionTitlePom } from "@/ui-kit/atoms/SectionTitle/SectionTitle.pom";

import { FILE_INSPECTOR_TEST_ID } from "./FileInspector.constants";

/** The selector of the element a facet is named in. */
const FACET_NAME_SELECTOR = "b";

/** What the first element of the summary starts with: the number of dependencies. */
const TOTAL_PATTERN = /^\d+ (?:dependency|dependencies)/;

/** Page object of the summary of the dependencies of a file, a part of the inspector: the page object of the inspector builds it, so it is exported only as a type. It has no test id: it finds the text that starts with the number of dependencies and takes the parent of that text as its root, which holds the counts after it. */
class DependencySummaryPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.pickMatch(
      this.searchBase
        .queryAllByText(TOTAL_PATTERN)
        .map((total) => total.parentElement as HTMLElement),
      `the text ${TOTAL_PATTERN}`
    );
  }

  /**
   * Whether the summary is the last part of the inspector, after the facets.
   * @returns True when the summary is the last child of the element that holds it.
   */
  get isLast(): boolean {
    return this.root.parentElement?.lastElementChild === this.root;
  }

  /**
   * The text of the first element, which is the number of dependencies.
   * @returns The text, such as `4 dependencies`, or `4 dependencies · not evaluated`.
   */
  get total(): string {
    return (this.root.firstElementChild as HTMLElement).textContent;
  }

  /**
   * The color of the number of dependencies.
   * @returns The computed color.
   */
  get totalColor(): string {
    return getComputedStyle(this.root.firstElementChild as HTMLElement).color;
  }

  /**
   * The counts after the number of dependencies: how many were allowed, disallowed and not checked.
   * @returns One page object for each count that the summary draws, in order.
   */
  get counts(): VerdictCountPom[] {
    const { count } = this.childPom(VerdictCountPom);

    return Array.from({ length: count }, (_, index) =>
      this.childPom(VerdictCountPom, { index })
    );
  }

  /**
   * What each count says, with its color.
   * @returns The text and the computed color of each count, in order.
   */
  get countTexts(): { text: string; color: string }[] {
    return this.counts.map(({ text, color }) => ({ text, color }));
  }
}

/** Page object of a facet of the description of a file, a part of the inspector: the page object of the inspector builds it, so it is exported only as a type. It has no test id: it finds the name of the facet by the `name` option, which is required, and takes the parent of the name as its root. */
class FacetPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const facetName = this.requireName();

    return this.pickMatch(
      this.searchBase
        .queryAllByText(facetName, { selector: FACET_NAME_SELECTOR })
        .map((label) => label.parentElement as HTMLElement),
      `the facet ${facetName}`
    );
  }

  /**
   * The keys of the facet, which are the `dt` elements.
   * @returns The elements in order.
   */
  private get keys(): HTMLElement[] {
    return Array.from(this.root.querySelectorAll("dt"));
  }

  /**
   * The value of a key.
   * @param key The key, such as `types`.
   * @returns The element that follows the key.
   * @throws When the facet has no such key.
   */
  private valueElement(key: string): HTMLElement {
    const keyElement = this.keys.find((item) => item.textContent === key);

    if (keyElement === undefined) {
      throw new Error(`${this.constructor.name} found no key "${key}"`);
    }

    return keyElement.nextElementSibling as HTMLElement;
  }

  /**
   * The properties of the facet.
   * @returns The text of the value of each key, by key, such as `{ types: '[ "module" ]' }`.
   */
  get entries(): Record<string, string> {
    return Object.fromEntries(
      this.keys.map((key) => [
        key.textContent,
        (key.nextElementSibling as HTMLElement).textContent,
      ])
    );
  }

  /**
   * The color a value is drawn in, which tells a value that is null apart from the others.
   * @param key The key, such as `types`.
   * @returns The computed color of the value.
   */
  valueColor(key: string): string {
    return getComputedStyle(this.valueElement(key)).color;
  }
}

/** Page object of the file inspector. */
export class FileInspectorPom extends Pom {
  protected readonly defaultTestId = FILE_INSPECTOR_TEST_ID;

  /**
   * The path of the file, over the facets.
   * @param path The path of the file in focus.
   * @returns The page object of the title.
   */
  title(path: string): SectionTitlePom {
    return this.childPom(SectionTitlePom, { name: path });
  }

  /**
   * The names of the facets.
   * @returns The text of each facet name, in order. Empty while the evaluation does not know the file.
   */
  get facetNames(): string[] {
    return this.scope
      .queryAllByText(/./, { selector: FACET_NAME_SELECTOR })
      .map((label) => label.textContent);
  }

  /**
   * The line that says how many dependencies the file has, under the facets.
   * @returns The page object of the summary, which is not rendered while the evaluation does not know the file.
   */
  get summary(): DependencySummaryPom {
    return this.childPom(DependencySummaryPom);
  }

  /**
   * Gets a facet of the description.
   * @param facetName The name of the facet, such as `element`.
   * @returns The page object of the facet.
   */
  facet(facetName: string): FacetPom {
    return this.childPom(FacetPom, { name: facetName });
  }
}

export type { DependencySummaryPom, FacetPom };
