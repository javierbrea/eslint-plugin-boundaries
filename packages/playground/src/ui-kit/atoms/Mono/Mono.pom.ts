import { Pom } from "@/shared/testing/pom";

/** The selector of the element a name or a path in mono is drawn in. */
const MONO_SELECTOR = "code";

/** Page object of a name or a path in mono. It has no role, label or test id: it finds the `code` elements within its parent, and the `containing` option picks the one with a given text. */
export class MonoPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.findRootBySelector(MONO_SELECTOR);
  }

  /**
   * How many names or paths in mono its parent holds, whatever the `index` and `containing` options. A page object that lists them builds one `MonoPom` per index below this number.
   * @returns The number of `code` elements within the parent.
   */
  get count(): number {
    return this.searchBaseElement.querySelectorAll(MONO_SELECTOR).length;
  }

  /**
   * The name or the path in mono.
   * @returns The text of the element.
   */
  get text(): string {
    return this.root.textContent;
  }

  /**
   * The element the text is drawn in.
   * @returns The tag name of the root, in upper case.
   */
  get tagName(): string {
    return this.root.tagName;
  }

  /**
   * The element that holds the text.
   * @returns The tag name of the parent of the root, in upper case, or an empty string when it has none.
   */
  get parentTagName(): string {
    return this.root.parentElement?.tagName ?? "";
  }

  /**
   * The font family of the text.
   * @returns The computed value.
   */
  get fontFamily(): string {
    return getComputedStyle(this.root).fontFamily;
  }

  /**
   * The font size of the text.
   * @returns The computed value.
   */
  get fontSize(): string {
    return getComputedStyle(this.root).fontSize;
  }

  /**
   * The space between the text and the edge of its box.
   * @returns The computed padding.
   */
  get padding(): string {
    return getComputedStyle(this.root).padding;
  }

  /**
   * The rounding of the corners of its box.
   * @returns The computed border radius.
   */
  get borderRadius(): string {
    return getComputedStyle(this.root).borderRadius;
  }
}
