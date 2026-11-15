import { Pom } from "@/shared/testing/pom";

/** Page object of a count badge. It has no test id: it finds the image within its parent, named by the `name` option when it is set (the label of the badge). */
export class CountBadgePom extends Pom {
  protected readonly defaultTestId = "";

  /**
   * The images within the parent, which are the badges.
   * @param accessibleName The accessible name to keep the images by. Every image is kept when it is unset.
   * @returns The images, in document order.
   */
  private findBadges(accessibleName?: string | RegExp): HTMLElement[] {
    return this.searchBase.queryAllByRole(
      "img",
      accessibleName === undefined ? {} : { name: accessibleName }
    );
  }

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const { name: accessibleName } = this.options;

    return this.pickMatch(
      this.findBadges(accessibleName),
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
   * Whether assistive technology reads the badge as an image with a given name, which is what the number counts, read instead of the bare number.
   * @param accessibleName The accessible name.
   * @returns True when the badge is among the images of that name of the element that holds it.
   */
  isImageNamed(accessibleName: string): boolean {
    return this.isNamed("img", accessibleName);
  }

  /**
   * The id of the badge, by which an element takes its name from it.
   * @returns The `id` of the root, or an empty string when it has none.
   */
  get id(): string {
    return this.root.id;
  }

  /**
   * Whether the tone reached the DOM as an attribute, which a badge must not do.
   * @returns True when the badge has a `tone` attribute.
   */
  get hasToneAttribute(): boolean {
    return this.root.hasAttribute("tone");
  }

  /**
   * The color of the count, which is the one of its tone mixed with the ink.
   * @returns The computed value.
   */
  get color(): string {
    return getComputedStyle(this.root).color;
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
