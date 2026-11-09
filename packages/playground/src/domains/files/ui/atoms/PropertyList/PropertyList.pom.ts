import { Pom } from "@/shared/testing/pom";

import type { PropertyListLayout } from "./PropertyList.types";

/** The selector of the element a property list is drawn in. */
const LIST_SELECTOR = "dl";

/** Page object of a property list. It has no test id: it finds the first `dl` within its parent. */
export class PropertyListPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.findRootBySelector(LIST_SELECTOR);
  }

  /**
   * The keys, which are the `dt` elements.
   * @returns The elements in order.
   */
  private get keyElements(): HTMLElement[] {
    return Array.from(this.root.querySelectorAll("dt"));
  }

  /**
   * The element of the value of a key, which follows the key.
   * @param key The key, such as `types`.
   * @returns The element that follows the key.
   * @throws When the list has no such key.
   */
  private valueElement(key: string): HTMLElement {
    return this.keyElement(key).nextElementSibling as HTMLElement;
  }

  /**
   * The element of a key.
   * @param key The key, such as `types`.
   * @returns The `dt` element.
   * @throws When the list has no such key.
   */
  private keyElement(key: string): HTMLElement {
    const keyElement = this.keyElements.find(
      (item) => item.textContent === key
    );

    if (keyElement === undefined) {
      throw new Error(`${this.constructor.name} found no key "${key}"`);
    }

    return keyElement;
  }

  /**
   * The properties of the list.
   * @returns The text of the value of each key, by key and in order, such as `{ types: '[ "module" ]' }`. A key with no value has an empty text.
   */
  get entries(): Record<string, string> {
    return Object.fromEntries(
      this.keyElements.map((key) => [
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

  /**
   * The color a key is drawn in.
   * @param key The key, such as `types`.
   * @returns The computed color of the key.
   */
  keyColor(key: string): string {
    return getComputedStyle(this.keyElement(key)).color;
  }

  /**
   * How far a key is indented.
   * @param key The key, such as `from`.
   * @returns The computed padding on the left of the key.
   */
  keyIndent(key: string): string {
    return getComputedStyle(this.keyElement(key)).paddingLeft;
  }

  /**
   * Where a value may break a word to fit its column.
   * @param key The key, such as `source`.
   * @returns The computed `overflow-wrap` of the value.
   */
  valueOverflowWrap(key: string): string {
    return getComputedStyle(this.valueElement(key)).overflowWrap;
  }

  /**
   * How the list lays out its keys and values.
   * @returns The computed display, columns and gaps of the list.
   */
  get layout(): PropertyListLayout {
    const { display, gridTemplateColumns, columnGap, rowGap } =
      getComputedStyle(this.root);

    return { display, gridTemplateColumns, columnGap, rowGap };
  }

  /**
   * The text styles of the list.
   * @returns The computed font family, size and line height.
   */
  get textStyle(): Record<"fontFamily" | "fontSize" | "lineHeight", string> {
    const { fontFamily, fontSize, lineHeight } = getComputedStyle(this.root);

    return { fontFamily, fontSize, lineHeight };
  }

  /**
   * The frame around the list.
   * @returns The computed border style and radius, and the padding inside it.
   */
  get frame(): Record<"borderStyle" | "borderRadius" | "padding", string> {
    const { borderTopStyle, borderRadius, padding } = getComputedStyle(
      this.root
    );

    return { borderStyle: borderTopStyle, borderRadius, padding };
  }
}
