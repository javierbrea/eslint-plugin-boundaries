import { Pom } from "@/shared/testing/pom";
import { IconPom } from "@/ui-kit/atoms/Icon/Icon.pom";

/** The selector of the icon that every count draws first. */
const ICON_SELECTOR = "svg";

/** Page object of a verdict count. It has no test id: it finds the icons within its parent and takes the parent of each one as a count, and the `index` and `containing` options pick among them. */
export class VerdictCountPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.pickMatch(
      Array.from(
        this.searchBaseElement.querySelectorAll<SVGElement>(ICON_SELECTOR)
      ).map((icon) => icon.parentElement as HTMLElement),
      "the parent of an icon"
    );
  }

  /**
   * How many counts its parent holds, whatever the `index` and `containing` options. A page object that lists them builds one `VerdictCountPom` per index below this number.
   * @returns The number of icons within the parent.
   */
  get count(): number {
    return this.searchBaseElement.querySelectorAll(ICON_SELECTOR).length;
  }

  /**
   * What the count says.
   * @returns The text of the count, without the icon.
   */
  get text(): string {
    return this.root.textContent;
  }

  /**
   * The color of the count and its icon.
   * @returns The computed color.
   */
  get color(): string {
    return getComputedStyle(this.root).color;
  }

  /**
   * The icon of the count.
   * @returns The page object of the icon.
   */
  get icon(): IconPom {
    return this.childPom(IconPom);
  }
}
