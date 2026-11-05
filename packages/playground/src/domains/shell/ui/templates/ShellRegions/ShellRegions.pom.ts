import { Pom } from "@/shared/testing/pom";

import { SHELL_REGIONS_TEST_ID } from "./ShellRegions.constants";

/** Page object of a group of panels, a part of the regions: the page object of the regions builds it, so it is exported only as a type. It has no test id: it finds the groups within its parent, and the `index` option picks one in document order, so the outer group comes first. */
class ShellRegionsGroupPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.findRootBySelector("[data-group]");
  }

  /**
   * The direction in which the group places its panels.
   * @returns The computed `flex-direction`.
   */
  get flexDirection(): string {
    return getComputedStyle(this.root).flexDirection;
  }

  /**
   * Whether a text is among the content of the group.
   * @param text The text of an element.
   * @returns True when an element with that text is inside the group.
   */
  holds(text: string): boolean {
    return this.scope.queryByText(text) !== null;
  }
}

/** Page object of a separator between regions, a part of the regions: the page object of the regions builds it, so it is exported only as a type. It has no test id: it finds the separators within its parent, and the `index` option picks one in document order. */
class ShellRegionsSeparatorPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.pickMatch(
      this.searchBase.queryAllByRole("separator"),
      'the role "separator"'
    );
  }

  /**
   * How many separators its parent holds, whatever the `index` option. A page object that lists them builds one `ShellRegionsSeparatorPom` per index below this number.
   * @returns The number of separators within the parent.
   */
  get count(): number {
    return this.searchBase.queryAllByRole("separator").length;
  }

  /**
   * What the separator resizes, which is its accessible name.
   * @returns The `aria-label` attribute, or null when the separator has none.
   */
  get label(): string | null {
    return this.root.getAttribute("aria-label");
  }

  /**
   * The orientation of the separator, which is across the regions it resizes.
   * @returns The `aria-orientation` attribute, or null when the separator has none.
   */
  get orientation(): string | null {
    return this.root.getAttribute("aria-orientation");
  }

  /**
   * Whether the keyboard reaches the separator.
   * @returns The `tabindex` attribute, or null when the separator has none.
   */
  get tabIndex(): string | null {
    return this.root.getAttribute("tabindex");
  }

  /**
   * The width of the separator.
   * @returns The computed value.
   */
  get width(): string {
    return getComputedStyle(this.root).width;
  }

  /**
   * The height of the separator.
   * @returns The computed value.
   */
  get height(): string {
    return getComputedStyle(this.root).height;
  }

  /**
   * The color of the line of the separator.
   * @returns The computed background color.
   */
  get backgroundColor(): string {
    return getComputedStyle(this.root).backgroundColor;
  }
}

/** Page object of the shell regions. It finds its root by the test id of the regions, or by the `testId` option when a module that is these regions gives it another. */
export class ShellRegionsPom extends Pom {
  protected readonly defaultTestId: string = SHELL_REGIONS_TEST_ID;

  /**
   * The group that stacks the row of the project, the node and the inspector over the problems.
   * @returns The page object of the outer group.
   */
  get column(): ShellRegionsGroupPom {
    return this.childPom(ShellRegionsGroupPom, { index: 0 });
  }

  /**
   * The group that places the project, the node and the inspector side by side.
   * @returns The page object of the inner group.
   */
  get row(): ShellRegionsGroupPom {
    return this.childPom(ShellRegionsGroupPom, { index: 1 });
  }

  /**
   * The separators between the regions, in document order.
   * @returns One page object for each separator.
   */
  get separators(): ShellRegionsSeparatorPom[] {
    const { count } = this.childPom(ShellRegionsSeparatorPom);

    return Array.from({ length: count }, (_, index) =>
      this.childPom(ShellRegionsSeparatorPom, { index })
    );
  }

  /**
   * What each separator resizes, in order.
   * @returns The accessible name of each separator.
   */
  get separatorLabels(): (string | null)[] {
    return this.separators.map(({ label }) => label);
  }

  /**
   * The orientation of each separator, in order.
   * @returns The `aria-orientation` of each separator.
   */
  get separatorOrientations(): (string | null)[] {
    return this.separators.map(({ orientation }) => orientation);
  }

  /**
   * Whether the keyboard reaches each separator, in order.
   * @returns The `tabindex` of each separator.
   */
  get separatorTabIndexes(): (string | null)[] {
    return this.separators.map(({ tabIndex }) => tabIndex);
  }

  /**
   * Whether a text is among the content of the regions.
   * @param text The text of an element.
   * @returns True when an element with that text is inside the regions.
   */
  holds(text: string): boolean {
    return this.scope.queryByText(text) !== null;
  }
}

export type { ShellRegionsGroupPom, ShellRegionsSeparatorPom };
