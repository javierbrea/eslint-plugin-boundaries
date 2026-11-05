import { fireEvent } from "@testing-library/react";

import { OWN_CLASS, getStyle } from "@/shared/testing/emittedStyle";
import { Pom } from "@/shared/testing/pom";
import { CountBadgePom } from "@/ui-kit/atoms/CountBadge/CountBadge.pom";
import { IconPom } from "@/ui-kit/atoms/Icon/Icon.pom";
import { PaneHeadPom } from "@/ui-kit/atoms/PaneHead/PaneHead.pom";

import {
  COLLAPSE_PROBLEMS_LABEL,
  EXPAND_PROBLEMS_LABEL,
  PROBLEMS_PANEL_LABEL,
  PROBLEMS_PANEL_TEST_ID,
  PROBLEM_LISTS_LABEL,
} from "./ProblemsPanel.constants";
import type { ProblemsPanelLabelStyle } from "./ProblemsPanel.types";

/** The name of the button that collapses or expands the panel, whichever it offers. */
const TOGGLE_NAME = new RegExp(
  `^(${COLLAPSE_PROBLEMS_LABEL}|${EXPAND_PROBLEMS_LABEL})$`
);

/** Page object of a tab of the problems panel. It has no test id: it finds the tabs within its parent, the one named by the `name` option (a string or a pattern, matched against the accessible name, such as `Sketch 2 problems`) when it is set, and the `index` and `containing` options pick among them. */
export class ProblemsTabPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const { name: accessibleName } = this.options;

    return this.pickMatch(
      this.searchBase.queryAllByRole(
        "tab",
        accessibleName === undefined ? {} : { name: accessibleName }
      ),
      accessibleName === undefined
        ? 'the role "tab"'
        : `the role "tab" named ${accessibleName}`
    );
  }

  /**
   * Everything the tab says, which is its label followed by its count.
   * @returns The text of the tab.
   */
  get text(): string {
    return this.root.textContent;
  }

  /**
   * The label of the tab, without its count.
   * @returns The text of the first node of the tab, which is the label.
   */
  get label(): string {
    return this.root.childNodes[0].textContent ?? "";
  }

  /**
   * Whether the tab is the selected one.
   * @returns True when its `aria-selected` attribute is `true`.
   */
  get isSelected(): boolean {
    return this.root.getAttribute("aria-selected") === "true";
  }

  /**
   * The id of the element of the tab, which the tab panel names itself by.
   * @returns The `id` attribute.
   */
  get elementId(): string {
    return this.root.id;
  }

  /**
   * The id of the tab panel that the tab controls.
   * @returns The `aria-controls` attribute, or null when the tab controls none.
   */
  get controls(): string | null {
    return this.root.getAttribute("aria-controls");
  }

  /**
   * The badge with the count of the tab.
   * @returns The page object of the badge.
   */
  get badge(): CountBadgePom {
    return this.childPom(CountBadgePom);
  }

  /**
   * Whether the tab draws a count.
   * @returns True when the tab has a badge.
   */
  get hasBadge(): boolean {
    return this.badge.isRendered;
  }

  /**
   * The icon after the label.
   * @returns The page object of the icon.
   */
  get icon(): IconPom {
    return this.childPom(IconPom);
  }

  /**
   * Whether the tab draws an icon.
   * @returns True when the tab has an icon.
   */
  get hasIcon(): boolean {
    return this.icon.isRendered;
  }

  /**
   * What comes after the label, in order.
   * @returns `icon` for the icon and `count` for the badge.
   */
  get partsAfterLabel(): ("icon" | "count")[] {
    return Array.from(this.root.childNodes)
      .slice(1)
      .map((node) =>
        (node as Element).getAttribute("role") === "img" ? "count" : "icon"
      );
  }

  /**
   * The text styles of the label. A label in mono is an element of its own, and any other label is the text of the tab.
   * @returns The computed styles of the element that draws the label.
   */
  get labelStyle(): ProblemsPanelLabelStyle {
    const [first] = Array.from(this.root.childNodes);
    const labelElement = first instanceof Element ? first : this.root;
    const { fontFamily, fontSize, fontWeight, lineHeight } =
      getComputedStyle(labelElement);

    return { fontFamily, fontSize, fontWeight, lineHeight };
  }

  /** Presses the tab. */
  select(): void {
    fireEvent.click(this.root);
  }
}

/** Page object of the body of the selected tab. It has no test id: it finds the tab panel within its parent, the one named by the `name` option (the accessible name of its tab) when it is set. */
export class ProblemsTabPanelPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const { name: accessibleName } = this.options;

    return this.pickMatch(
      this.searchBase.queryAllByRole(
        "tabpanel",
        accessibleName === undefined ? {} : { name: accessibleName }
      ),
      accessibleName === undefined
        ? 'the role "tabpanel"'
        : `the role "tabpanel" named ${accessibleName}`
    );
  }

  /**
   * What the body holds.
   * @returns The text of the tab panel.
   */
  get text(): string {
    return this.root.textContent;
  }

  /**
   * The id of the element of the tab panel, which the selected tab controls.
   * @returns The `id` attribute.
   */
  get elementId(): string {
    return this.root.id;
  }

  /**
   * The id of the tab that names the tab panel.
   * @returns The `aria-labelledby` attribute, or null when the tab panel has none.
   */
  get labelledBy(): string | null {
    return this.root.getAttribute("aria-labelledby");
  }

  /**
   * Whether the keyboard reaches the tab panel, which scrolls and may hold nothing to focus.
   * @returns The `tabindex` attribute, or null when the tab panel has none.
   */
  get tabIndex(): string | null {
    return this.root.getAttribute("tabindex");
  }

  /**
   * The ring that shows the keyboard focus, which jsdom cannot compute: it is read from the rule that applies on keyboard focus.
   * @returns The declarations of that rule.
   */
  get focusStyle(): Record<string, string> {
    return getStyle(this.root, `${OWN_CLASS}:focus-visible`);
  }
}

/** Page object of the button that collapses or expands the panel. It has no test id: it finds the button by its label, whichever of the two it has, within its parent. */
export class ProblemsToggleButtonPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.pickMatch(
      this.searchBase.queryAllByRole("button", { name: TOGGLE_NAME }),
      `the role "button" named ${TOGGLE_NAME}`
    );
  }

  /**
   * What the button offers.
   * @returns The `aria-label` attribute, such as `Collapse the problems`.
   */
  get label(): string | null {
    return this.root.getAttribute("aria-label");
  }

  /**
   * The chevron of the button.
   * @returns The page object of the icon.
   */
  get icon(): IconPom {
    return this.childPom(IconPom);
  }

  /** Presses the button. */
  press(): void {
    fireEvent.click(this.root);
  }
}

/** Page object of the problems panel. It finds its root by the test id of the panel, or by the `testId` option when a module that is this panel gives it another. */
export class ProblemsPanelPom extends Pom {
  protected readonly defaultTestId: string = PROBLEMS_PANEL_TEST_ID;

  /**
   * Whether assistive technology reads the panel as a region named after it.
   * @returns True when the panel is among the regions of its parent named Problems.
   */
  get isLandmark(): boolean {
    return this.searchBase
      .queryAllByRole("region", { name: PROBLEMS_PANEL_LABEL })
      .includes(this.root);
  }

  /**
   * The head of the panel.
   * @returns The page object of the head.
   */
  get head(): PaneHeadPom {
    return this.childPom(PaneHeadPom, { name: PROBLEMS_PANEL_LABEL });
  }

  /**
   * The name of the strip of tabs.
   * @returns The `aria-label` of the tab list, or null when the panel has none.
   */
  get tablistLabel(): string | null {
    return (
      this.scope
        .queryByRole("tablist", { name: PROBLEM_LISTS_LABEL })
        ?.getAttribute("aria-label") ?? null
    );
  }

  /**
   * The tabs of the panel, in order.
   * @returns One page object for each tab.
   */
  get tabs(): ProblemsTabPom[] {
    return Array.from(
      { length: this.scope.queryAllByRole("tab").length },
      (_, index) => this.childPom(ProblemsTabPom, { index })
    );
  }

  /**
   * What each tab says, in order.
   * @returns The label of each tab followed by its count.
   */
  get tabTexts(): string[] {
    return this.tabs.map(({ text }) => text);
  }

  /**
   * What the selected tab says.
   * @returns The text of the selected tab, or null when none is selected.
   */
  get selectedTabText(): string | null {
    return (
      this.scope.queryAllByRole("tab", { selected: true })[0]?.textContent ??
      null
    );
  }

  /**
   * Gets a tab by its accessible name.
   * @param accessibleName The accessible name of the tab, such as `Sketch 2 problems`, or a pattern.
   * @returns The page object of the tab.
   */
  tab(accessibleName: string | RegExp): ProblemsTabPom {
    return this.childPom(ProblemsTabPom, { name: accessibleName });
  }

  /**
   * Gets the body of the selected tab.
   * @param accessibleName The accessible name of the tab it belongs to, when the caller wants to check it.
   * @returns The page object of the tab panel, which is not rendered while the panel is collapsed.
   */
  tabPanel(accessibleName?: string | RegExp): ProblemsTabPanelPom {
    return this.childPom(ProblemsTabPanelPom, { name: accessibleName });
  }

  /**
   * The button that collapses or expands the panel.
   * @returns The page object of the button.
   */
  get toggle(): ProblemsToggleButtonPom {
    return this.childPom(ProblemsToggleButtonPom);
  }

  /**
   * What the buttons that collapse or expand the panel offer.
   * @returns The label of each such button, in order: one while the panel works.
   */
  get toggleLabels(): (string | null)[] {
    return this.scope
      .queryAllByRole("button", { name: TOGGLE_NAME })
      .map((button) => button.getAttribute("aria-label"));
  }

  /**
   * Whether a text is among the content of the panel.
   * @param text The text of an element.
   * @returns True when an element with that text is inside the panel.
   */
  holds(text: string): boolean {
    return this.scope.queryByText(text) !== null;
  }
}
