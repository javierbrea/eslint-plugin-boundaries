import { Pom } from "@/shared/testing/pom";

/** Page object of a count badge. It has no test id: it finds the image within its parent, named by the `name` option when it is set (the label of the badge). */
export class CountBadgePom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const { name: accessibleName } = this.options;

    return this.pickMatch(
      this.searchBase.queryAllByRole(
        "img",
        accessibleName === undefined ? {} : { name: accessibleName }
      ),
      accessibleName === undefined
        ? 'the role "img"'
        : `the role "img" named ${accessibleName}`
    );
  }

  /**
   * The number the badge shows.
   * @returns The text of the badge.
   */
  get count(): string {
    return this.root.textContent;
  }

  /**
   * What the number counts, which assistive technology reads instead of the bare number.
   * @returns The `aria-label` attribute, or null when the badge has none.
   */
  get label(): string | null {
    return this.root.getAttribute("aria-label");
  }

  /**
   * Whether the tone reached the DOM as an attribute, which a badge must not do.
   * @returns True when the badge has a `tone` attribute.
   */
  get hasToneAttribute(): boolean {
    return this.root.hasAttribute("tone");
  }

  /**
   * The font family of the count.
   * @returns The computed value.
   */
  get fontFamily(): string {
    return getComputedStyle(this.root).fontFamily;
  }

  /**
   * The font size of the count.
   * @returns The computed value.
   */
  get fontSize(): string {
    return getComputedStyle(this.root).fontSize;
  }

  /**
   * The font weight of the count.
   * @returns The computed value.
   */
  get fontWeight(): string {
    return getComputedStyle(this.root).fontWeight;
  }

  /**
   * The line height of the count.
   * @returns The computed value.
   */
  get lineHeight(): string {
    return getComputedStyle(this.root).lineHeight;
  }
}
