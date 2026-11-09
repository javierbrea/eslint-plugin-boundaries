import { Pom } from "@/shared/testing/pom";
import { IconPom } from "@/ui-kit/atoms/Icon/Icon.pom";

import type { ShareMessageTextStyle } from "./ShareMessage.types";

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
   * The element of the words of the message, which is the last one of the region: the check icon, when there is one, comes before it.
   * @returns The element.
   */
  private get textElement(): HTMLElement {
    return this.root.lastElementChild as HTMLElement;
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

  /**
   * How little room the region can be left with: a region that can shrink to nothing gives way before the buttons of the bar do.
   * @returns The computed `min-width` of the region.
   */
  get minWidth(): string {
    return getComputedStyle(this.root).minWidth;
  }

  /**
   * What the words do when the region has no room for them.
   * @returns The computed `min-width`, `overflow`, `text-overflow` and `white-space` of the element of the words.
   */
  get textStyle(): ShareMessageTextStyle {
    const { minWidth, overflow, textOverflow, whiteSpace } = getComputedStyle(
      this.textElement
    );

    return { minWidth, overflow, textOverflow, whiteSpace };
  }

  /**
   * What a pointer over the words shows, which is the whole message when the words are cut.
   * @returns The `title` of the element of the words, or null when it has none.
   */
  get title(): string | null {
    return this.textElement.getAttribute("title");
  }

  /**
   * How much the check icon shrinks inside the region, which it never does.
   * @returns The computed `flex-shrink` of the element that wraps the icon, which is the first one of the region.
   * @throws When the message has no check icon.
   */
  get checkFlexShrink(): string {
    if (!this.hasCheck) {
      throw new Error(`${this.constructor.name} found no check icon`);
    }

    return getComputedStyle(this.root.firstElementChild as HTMLElement)
      .flexShrink;
  }
}
