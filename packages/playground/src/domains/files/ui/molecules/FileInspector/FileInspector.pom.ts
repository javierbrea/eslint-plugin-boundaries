import { Pom } from "@/shared/testing/pom";
import { SectionTitlePom } from "@/ui-kit/atoms/SectionTitle/SectionTitle.pom";

import { FILE_INSPECTOR_TEST_ID } from "./FileInspector.constants";

/** The selector of the element a facet is named in. */
const FACET_NAME_SELECTOR = "b";

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
   * Gets a facet of the description.
   * @param facetName The name of the facet, such as `element`.
   * @returns The page object of the facet.
   */
  facet(facetName: string): FacetPom {
    return this.childPom(FacetPom, { name: facetName });
  }
}

export type { FacetPom };
