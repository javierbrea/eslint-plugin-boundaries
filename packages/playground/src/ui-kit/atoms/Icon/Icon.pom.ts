import { Pom } from "@/shared/testing/pom";

import type { IconWrapperStyle } from "./Icon.types";

/** The selector of the element an icon is drawn in. */
const ICON_SELECTOR = "svg";

/** Page object of an icon. It has no test id: it finds the first `svg` within its parent, or the image named by the `name` option when the icon has a label. */
export class IconPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const { name: accessibleName } = this.options;

    if (accessibleName === undefined) {
      return this.findRootBySelector(ICON_SELECTOR);
    }

    return this.pickMatch(
      this.searchBase.queryAllByRole("img", { name: accessibleName }),
      `the role "img" named ${accessibleName}`
    );
  }

  /**
   * How many icons its parent holds, whatever the `name`, `index` and `containing` options. A page object that lists them builds one `IconPom` per index below this number.
   * @returns The number of `svg` elements within the parent.
   */
  get count(): number {
    return this.searchBaseElement.querySelectorAll(ICON_SELECTOR).length;
  }

  /**
   * The attributes of the `svg` element.
   * @returns Each attribute name with its value; an attribute the element has not is undefined.
   */
  get attributes(): Partial<Record<string, string>> {
    return Object.fromEntries(
      Array.from(this.root.attributes).map((attribute) => [
        attribute.name,
        attribute.value,
      ])
    );
  }

  /**
   * The outline of the icon.
   * @returns The `d` attribute of its path, or an empty string when it draws none.
   */
  get pathData(): string {
    return this.root.querySelector("path")?.getAttribute("d") ?? "";
  }

  /**
   * The width of the icon.
   * @returns The `width` attribute, or null when the icon has none.
   */
  get width(): string | null {
    return this.root.getAttribute("width");
  }

  /**
   * The height of the icon.
   * @returns The `height` attribute, or null when the icon has none.
   */
  get height(): string | null {
    return this.root.getAttribute("height");
  }

  /**
   * The role the icon sets.
   * @returns The `role` attribute, or null when the icon has none.
   */
  get role(): string | null {
    return this.root.getAttribute("role");
  }

  /**
   * Whether the icon is hidden from assistive technology.
   * @returns True when its `aria-hidden` attribute is `true`.
   */
  get isHidden(): boolean {
    return this.root.getAttribute("aria-hidden") === "true";
  }

  /**
   * Whether assistive technology reads the icon as an image.
   * @returns True when the icon is among the images of its parent that are not hidden.
   */
  get isImage(): boolean {
    return this.searchBase.queryAllByRole("img").includes(this.root);
  }

  /**
   * Whether assistive technology reads the icon as an image with a given name, which is what the icon says.
   * @param accessibleName The accessible name.
   * @returns True when the icon is among the images of that name of the element that holds it.
   */
  isImageNamed(accessibleName: string): boolean {
    return this.isNamed("img", accessibleName);
  }

  /**
   * Whether the icon is a tab stop in old browsers.
   * @returns The `focusable` attribute, or null when the icon has none.
   */
  get focusable(): string | null {
    return this.root.getAttribute("focusable");
  }

  /**
   * How much the icon shrinks inside a flex container.
   * @returns The computed `flex-shrink`.
   */
  get flexShrink(): string {
    return getComputedStyle(this.root).flexShrink;
  }

  /**
   * The styles of the element that wraps the icon, where a caller sets the tone and the turn of an icon, since the icon takes the current color.
   * @returns The computed color and transform of the parent of the icon.
   */
  get wrapperStyle(): IconWrapperStyle {
    const { color, transform } = getComputedStyle(
      this.root.parentElement as HTMLElement
    );

    return { color, transform };
  }
}
