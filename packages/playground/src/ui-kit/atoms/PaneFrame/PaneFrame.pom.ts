import { within } from "@testing-library/react";

import { Pom } from "@/shared/testing/pom";

/** Page object of the landmark of a pane. It has no test id: it finds the region within its parent, named by the `name` option, which is required, unless the `root` option is the frame itself, as a component that is the frame sets it. */
export class PaneFramePom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const regionName = this.requireName();

    return this.pickMatch(
      this.searchBase.queryAllByRole("region", { name: regionName }),
      `the role "region" named ${regionName}`
    );
  }

  /**
   * The accessible name of the landmark.
   * @returns The `aria-label` attribute, or null when the frame has none.
   */
  get label(): string | null {
    return this.root.getAttribute("aria-label");
  }

  /**
   * The element the frame is drawn in.
   * @returns The tag name of the root, in upper case.
   */
  get tagName(): string {
    return this.root.tagName;
  }

  /**
   * The test id the frame renders, which a component that is the frame gives it.
   * @returns The `data-testid` attribute, or null when the frame has none.
   */
  get renderedTestId(): string | null {
    return this.root.getAttribute("data-testid");
  }

  /**
   * Whether assistive technology reads the frame as a region.
   * @returns True when the frame is among the regions of the element that holds it, whatever the parent of the page object, which a component that is the frame makes its own root.
   */
  get isLandmark(): boolean {
    return within(this.root.parentElement ?? document.body)
      .queryAllByRole("region")
      .includes(this.root);
  }

  /**
   * Whether a text is among the content of the landmark.
   * @param text The text of an element.
   * @returns True when an element with that text is inside the landmark.
   */
  holds(text: string): boolean {
    return this.scope.queryByText(text) !== null;
  }

  /**
   * The text of each child of the landmark, in order.
   * @returns The text of the head, the body and so on.
   */
  get childTexts(): string[] {
    return Array.from(this.root.children).map((child) => child.textContent);
  }

  /**
   * How the landmark lays out its children.
   * @returns The computed `display`.
   */
  get display(): string {
    return getComputedStyle(this.root).display;
  }

  /**
   * The direction of the children of the landmark.
   * @returns The computed `flex-direction`.
   */
  get flexDirection(): string {
    return getComputedStyle(this.root).flexDirection;
  }

  /**
   * The height of the landmark.
   * @returns The computed value.
   */
  get height(): string {
    return getComputedStyle(this.root).height;
  }

  /**
   * What the border and the padding of the landmark count in its size.
   * @returns The computed `box-sizing`.
   */
  get boxSizing(): string {
    return getComputedStyle(this.root).boxSizing;
  }

  /**
   * The narrowest the landmark may get.
   * @returns The computed `min-width`.
   */
  get minWidth(): string {
    return getComputedStyle(this.root).minWidth;
  }

  /**
   * The shortest the landmark may get.
   * @returns The computed `min-height`.
   */
  get minHeight(): string {
    return getComputedStyle(this.root).minHeight;
  }
}
