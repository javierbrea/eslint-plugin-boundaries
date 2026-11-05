import { within } from "@testing-library/react";

import { Pom } from "@/shared/testing/pom";
import { PaneHeadPom } from "@/ui-kit/atoms/PaneHead/PaneHead.pom";

import {
  PROJECT_PANE_LAYOUT_LABEL,
  PROJECT_PANE_LAYOUT_TEST_ID,
} from "./ProjectPaneLayout.constants";

/** Page object of the layout of the project pane. It finds its root by the test id of the layout, or by the `testId` option when a module that is this pane gives it another. */
export class ProjectPaneLayoutPom extends Pom {
  protected readonly defaultTestId: string = PROJECT_PANE_LAYOUT_TEST_ID;

  /**
   * The accessible name of the landmark.
   * @returns The `aria-label` attribute, or null when the layout has none.
   */
  get label(): string | null {
    return this.root.getAttribute("aria-label");
  }

  /**
   * Whether assistive technology reads the layout as a region named after the pane.
   * @returns True when the layout is among the regions named `Project` of the element that holds it, whatever the parent of the page object, which a module that is the layout makes its own root.
   */
  get isLandmark(): boolean {
    return within(this.root.parentElement ?? document.body)
      .queryAllByRole("region", { name: PROJECT_PANE_LAYOUT_LABEL })
      .includes(this.root);
  }

  /**
   * The element the layout is drawn in.
   * @returns The tag name of the root, in upper case.
   */
  get tagName(): string {
    return this.root.tagName;
  }

  /**
   * How the layout places its children.
   * @returns The computed `display`.
   */
  get display(): string {
    return getComputedStyle(this.root).display;
  }

  /**
   * The text of each child of the layout, in order.
   * @returns The text of the head, the body and the foot.
   */
  get childTexts(): string[] {
    return Array.from(this.root.children).map((child) => child.textContent);
  }

  /**
   * The head of the pane.
   * @returns The page object of the head.
   */
  get head(): PaneHeadPom {
    return this.childPom(PaneHeadPom, { name: PROJECT_PANE_LAYOUT_LABEL });
  }
}
