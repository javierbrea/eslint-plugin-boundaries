import { within } from "@testing-library/react";

import { Pom } from "@/shared/testing/pom";

/** Page object of the announcement that a link was copied. It has no test id: it finds the element with the role `status` within its parent. It looks for it even where assistive technology skips the part of the page that holds it, such as the top bar while a dialog is open, so that a spec can still read what it says. */
export class CopiedAnnouncementPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.pickMatch(
      this.searchBase.queryAllByRole("status", { hidden: true }),
      'the role "status"'
    );
  }

  /**
   * What the announcement says.
   * @returns The text of the region, which is empty while there is nothing to announce.
   */
  get text(): string {
    return this.root.textContent;
  }

  /**
   * How a screen reader is told about a new text: whether it interrupts what it is reading or waits for it to end.
   * @returns The `aria-live` attribute of the region, or null when it has none.
   */
  get politeness(): string | null {
    return this.root.getAttribute("aria-live");
  }

  /**
   * Whether assistive technology reads the region as a status, which it does not when the region is hidden from it.
   * @returns True when the region is among the statuses that assistive technology reads in the element that holds it.
   */
  get isReadAsStatus(): boolean {
    return within(this.root.parentElement ?? document.body)
      .queryAllByRole("status")
      .includes(this.root);
  }

  /**
   * Whether the region is never drawn: it is out of the flow, as small as a pixel, and clipped away.
   * @returns True when its computed style is that of a visually hidden element.
   */
  get isVisuallyHidden(): boolean {
    const { position, width, height, overflow, clipPath } = getComputedStyle(
      this.root
    );

    return (
      position === "absolute" &&
      width === "1px" &&
      height === "1px" &&
      overflow === "hidden" &&
      clipPath === "inset(50%)"
    );
  }

  /**
   * Whether the region is removed from the layout and from what assistive technology reads, as `display: none` does, instead of only being hidden from the eyes.
   * @returns True when its computed `display` is `none`.
   */
  get isRemoved(): boolean {
    return getComputedStyle(this.root).display === "none";
  }
}
