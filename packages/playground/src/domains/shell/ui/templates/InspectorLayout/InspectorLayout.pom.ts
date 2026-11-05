import { within } from "@testing-library/react";

import { Pom } from "@/shared/testing/pom";
import { PaneHeadPom } from "@/ui-kit/atoms/PaneHead/PaneHead.pom";

import {
  INSPECTOR_LAYOUT_LABEL,
  INSPECTOR_LAYOUT_TEST_ID,
} from "./InspectorLayout.constants";

/** Page object of the inspector layout. It finds its root by the test id of the layout, or by the `testId` option when a module that is this pane gives it another. */
export class InspectorLayoutPom extends Pom {
  protected readonly defaultTestId: string = INSPECTOR_LAYOUT_TEST_ID;

  /**
   * The accessible name of the landmark.
   * @returns The `aria-label` attribute, or null when the layout has none.
   */
  get label(): string | null {
    return this.root.getAttribute("aria-label");
  }

  /**
   * Whether assistive technology reads the layout as a complementary landmark named after it.
   * @returns True when the layout is among the complementary landmarks named `Inspector` of the element that holds it, whatever the parent of the page object, which a module that is the layout makes its own root.
   */
  get isLandmark(): boolean {
    return within(this.root.parentElement ?? document.body)
      .queryAllByRole("complementary", { name: INSPECTOR_LAYOUT_LABEL })
      .includes(this.root);
  }

  /**
   * Everything the layout says: its head and what it holds.
   * @returns The text of the root.
   */
  get text(): string {
    return this.root.textContent;
  }

  /**
   * The head of the pane.
   * @returns The page object of the head.
   */
  get head(): PaneHeadPom {
    return this.childPom(PaneHeadPom, { name: INSPECTOR_LAYOUT_LABEL });
  }
}
