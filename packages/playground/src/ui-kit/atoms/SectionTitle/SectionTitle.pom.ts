import { Pom } from "@/shared/testing/pom";

/** Page object of a section title. It has no role or test id: it finds the title by its text, which is the `name` option and is required. */
export class SectionTitlePom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const text = this.requireName();

    return this.pickMatch(
      this.searchBase.queryAllByText(text),
      `the text ${text}`
    );
  }

  /**
   * The path or the name the title shows.
   * @returns The text of the title.
   */
  get text(): string {
    return this.root.textContent;
  }

  /**
   * The font family of the title.
   * @returns The computed value.
   */
  get fontFamily(): string {
    return getComputedStyle(this.root).fontFamily;
  }

  /**
   * The font size of the title.
   * @returns The computed value.
   */
  get fontSize(): string {
    return getComputedStyle(this.root).fontSize;
  }

  /**
   * The font weight of the title.
   * @returns The computed value.
   */
  get fontWeight(): string {
    return getComputedStyle(this.root).fontWeight;
  }

  /**
   * The line height of the title.
   * @returns The computed value.
   */
  get lineHeight(): string {
    return getComputedStyle(this.root).lineHeight;
  }

  /**
   * Where the title may break a word to fit its width.
   * @returns The computed `overflow-wrap`.
   */
  get overflowWrap(): string {
    return getComputedStyle(this.root).overflowWrap;
  }
}
