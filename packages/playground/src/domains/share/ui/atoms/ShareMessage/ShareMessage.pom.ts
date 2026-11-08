import { Pom } from "@/shared/testing/pom";
import { IconPom } from "@/ui-kit/atoms/Icon/Icon.pom";

/** The selector of the live region: the element that announces the message politely. */
const REGION_SELECTOR = "[role='status']";

/** Page object of the message that says how the last share went. It has no test id: it finds the live region within its parent. */
export class ShareMessagePom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.findRootBySelector(REGION_SELECTOR);
  }

  /**
   * Everything the message says.
   * @returns The text of the region, which is empty while there is no message.
   */
  get text(): string {
    return this.root.textContent;
  }

  /**
   * How a screen reader is told about a new message: whether it interrupts what it is reading or waits for it to end.
   * @returns The `aria-live` attribute of the region, or null when it has none.
   */
  get liveness(): string | null {
    return this.root.getAttribute("aria-live");
  }

  /**
   * The color of the words.
   * @returns The computed value.
   */
  get color(): string {
    return getComputedStyle(this.root).color;
  }

  /**
   * The size of the words.
   * @returns The computed `font-size`.
   */
  get fontSize(): string {
    return getComputedStyle(this.root).fontSize;
  }

  /**
   * The font of the words.
   * @returns The computed `font-family`.
   */
  get fontFamily(): string {
    return getComputedStyle(this.root).fontFamily;
  }

  /**
   * How the region is placed: it leaves the flow of its container while it is empty.
   * @returns The computed `position`.
   */
  get position(): string {
    return getComputedStyle(this.root).position;
  }

  /**
   * The check icon before the words.
   * @returns The page object of the icon, which is not rendered when the message has none.
   */
  get check(): IconPom {
    return this.childPom(IconPom);
  }

  /**
   * Whether the message starts with a check icon.
   * @returns True when the region holds an icon.
   */
  get hasCheck(): boolean {
    return this.check.isRendered;
  }

  /**
   * The color of the check icon, which is the color of what is allowed.
   * @returns The computed color of the element that wraps the icon.
   */
  get checkColor(): string {
    return this.check.wrapperStyle.color;
  }
}
