import { Pom } from "@/shared/testing/pom";
import { PaneHeadPom } from "@/ui-kit/atoms/PaneHead/PaneHead.pom";

import { INSPECTOR_LAYOUT_TEST_ID } from "./InspectorLayout.constants";

/** Page object of the inspector layout. It finds its root by the test id of the layout, or by the `testId` option when a module that is this pane gives it another. */
export class InspectorLayoutPom extends Pom {
  protected readonly defaultTestId: string = INSPECTOR_LAYOUT_TEST_ID;

  /**
   * Whether assistive technology reads the layout as a complementary landmark with a given name.
   * @param accessibleName The accessible name.
   * @returns True when the layout is among the complementary landmarks of that name of the element that holds it, whatever the parent of the page object, which a module that is the layout makes its own root.
   */
  isComplementaryNamed(accessibleName: string): boolean {
    return this.isNamed("complementary", accessibleName);
  }

  /**
   * Everything the layout says: its head and what it holds.
   * @returns The text of the root.
   */
  get text(): string {
    return this.root.textContent;
  }

  /**
   * How the content sizes the rows of the parts it holds, one under the other.
   * @returns The computed `grid-auto-rows` of the content, which is the last child of the layout.
   */
  get contentRowSizing(): string {
    return getComputedStyle(this.root.lastElementChild as Element).gridAutoRows;
  }

  /**
   * How visible the content is, which fades while what it describes is out of date.
   * @returns The computed `opacity` of the content, which is the last child of the layout: `1`, or `0.5` while it is faded.
   */
  get contentOpacity(): string {
    return getComputedStyle(this.root.lastElementChild as Element).opacity;
  }

  /**
   * The head of the pane, which is the first child of the layout.
   * @returns The page object of the head.
   */
  get head(): PaneHeadPom {
    return this.childPom(PaneHeadPom);
  }
}
