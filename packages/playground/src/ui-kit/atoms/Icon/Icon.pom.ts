import { Pom } from "@/shared/testing/pom";

/** Page object of an icon. It has no test id: it finds the first `svg` within its parent, or the image named by the `name` option when the icon has a label. */
export class IconPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const { name: accessibleName } = this.options;

    if (accessibleName === undefined) {
      return this.findRootBySelector("svg");
    }

    return this.pickMatch(
      this.searchBase.queryAllByRole("img", { name: accessibleName }),
      `the role "img" named ${accessibleName}`
    );
  }

  /**
   * The attributes of the `svg` element.
   * @returns Each attribute name with its value.
   */
  get attributes(): Record<string, string> {
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
   * @returns The `width` attribute in pixels.
   */
  get width(): number {
    return Number(this.root.getAttribute("width"));
  }

  /**
   * The height of the icon.
   * @returns The `height` attribute in pixels.
   */
  get height(): number {
    return Number(this.root.getAttribute("height"));
  }

  /**
   * What the icon says.
   * @returns The `aria-label` attribute, or null when the icon has none.
   */
  get label(): string | null {
    return this.root.getAttribute("aria-label");
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
}
