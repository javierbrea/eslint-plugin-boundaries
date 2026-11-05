import { within } from "@testing-library/react";

import { TopBarPom } from "@/domains/shell/ui/atoms/TopBar/TopBar.pom";
import { ShellRegionsPom } from "@/domains/shell/ui/templates/ShellRegions/ShellRegions.pom";
import { Pom } from "@/shared/testing/pom";

import { SHELL_LAYOUT_TEST_ID } from "./ShellLayout.constants";

/** Page object of the shell layout. It finds its root by the test id of the layout, or by the `testId` option when a module that is the shell gives it another. */
export class ShellLayoutPom extends Pom {
  protected readonly defaultTestId: string = SHELL_LAYOUT_TEST_ID;

  /**
   * The grid inside the frame, which places the top bar and the regions.
   * @returns The element.
   * @throws When the frame has no grid.
   */
  private get grid(): HTMLElement {
    const { firstElementChild: grid } = this.root;

    if (grid === null) {
      throw new Error(`${this.constructor.name} found no grid in the frame`);
    }

    return grid as HTMLElement;
  }

  /**
   * The child of the grid in a position, which is a slot of the layout whatever the test id its content renders.
   * @param position The position among the children of the grid: 0 for the top bar and 1 for the regions.
   * @param slotName What the slot holds, for the error.
   * @returns The element.
   * @throws When the grid has no child in that position.
   */
  private slot(position: number, slotName: string): HTMLElement {
    const slot = this.grid.children.item(position);

    if (slot === null) {
      throw new Error(
        `${this.constructor.name} found no ${slotName} in the grid`
      );
    }

    return slot as HTMLElement;
  }

  /**
   * The accessible name of the landmark.
   * @returns The `aria-label` attribute, or null when the layout has none.
   */
  get label(): string | null {
    return this.root.getAttribute("aria-label");
  }

  /**
   * Whether assistive technology reads the layout as a region with a given name.
   * @param accessibleName The accessible name.
   * @returns True when the layout is among the regions of that name of the element that holds it, whatever the parent of the page object, which a module that is the layout makes its own root.
   */
  isRegionNamed(accessibleName: string): boolean {
    return within(this.root.parentElement ?? document.body)
      .queryAllByRole("region", { name: accessibleName })
      .includes(this.root);
  }

  /**
   * The element the frame is drawn in.
   * @returns The tag name of the root, in upper case.
   */
  get tagName(): string {
    return this.root.tagName;
  }

  /**
   * What the border and the padding of the frame count in its size.
   * @returns The computed `box-sizing`.
   */
  get boxSizing(): string {
    return getComputedStyle(this.root).boxSizing;
  }

  /**
   * The width of the frame.
   * @returns The computed value.
   */
  get width(): string {
    return getComputedStyle(this.root).width;
  }

  /**
   * The height of the frame.
   * @returns The computed value.
   */
  get height(): string {
    return getComputedStyle(this.root).height;
  }

  /**
   * The narrowest the frame may get.
   * @returns The computed `min-width`.
   */
  get minWidth(): string {
    return getComputedStyle(this.root).minWidth;
  }

  /**
   * The shortest the frame may get.
   * @returns The computed `min-height`.
   */
  get minHeight(): string {
    return getComputedStyle(this.root).minHeight;
  }

  /**
   * How the grid places its children.
   * @returns The computed `display`.
   */
  get gridDisplay(): string {
    return getComputedStyle(this.grid).display;
  }

  /**
   * The rows of the grid: the top bar and what the regions take.
   * @returns The computed `grid-template-rows`.
   */
  get gridRows(): string {
    return getComputedStyle(this.grid).gridTemplateRows;
  }

  /**
   * The height of the grid.
   * @returns The computed value.
   */
  get gridHeight(): string {
    return getComputedStyle(this.grid).height;
  }

  /**
   * The text of each child of the grid, in order.
   * @returns The text of the top bar and the regions.
   */
  get childTexts(): string[] {
    return Array.from(this.grid.children).map((child) => child.textContent);
  }

  /**
   * The top bar, when the layout holds the bar of the shell. It is the first child of the grid, found by its position and not by a test id, so it is the same whatever test id the bar renders.
   * @returns The page object of the top bar.
   * @throws When the grid has no child.
   */
  get topBar(): TopBarPom {
    return this.childPom(TopBarPom, { root: this.slot(0, "top bar") });
  }

  /**
   * The regions, when the layout holds the regions of the shell. They are the second child of the grid, found by their position and not by a test id, so they are the same whatever test id the regions render, such as the one that the shell panes give them.
   * @returns The page object of the regions.
   * @throws When the grid has fewer than two children.
   */
  get regions(): ShellRegionsPom {
    return this.childPom(ShellRegionsPom, { root: this.slot(1, "regions") });
  }
}
