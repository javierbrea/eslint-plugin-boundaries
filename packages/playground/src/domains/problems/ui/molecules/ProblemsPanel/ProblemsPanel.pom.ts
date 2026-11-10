import { fireEvent, within } from "@testing-library/react";

import { OWN_CLASS, getStyle } from "@/shared/testing/emittedStyle";
import { Pom } from "@/shared/testing/pom";
import { CountBadgePom } from "@/ui-kit/atoms/CountBadge/CountBadge.pom";
import { IconPom } from "@/ui-kit/atoms/Icon/Icon.pom";
import { PaneHeadPom } from "@/ui-kit/atoms/PaneHead/PaneHead.pom";

import {
  COLLAPSE_PROBLEMS_LABEL,
  EXPAND_PROBLEMS_LABEL,
  PROBLEMS_PANEL_TEST_ID,
} from "./ProblemsPanel.constants";
import type { ProblemsPanelLabelStyle } from "./ProblemsPanel.types";

/** The name of the button that collapses or expands the panel, whichever it offers. */
const TOGGLE_NAME = new RegExp(
  `^(${COLLAPSE_PROBLEMS_LABEL}|${EXPAND_PROBLEMS_LABEL})$`
);

/** Page object of a tab of the problems panel, a part of the panel: the page object of the panel builds it, so it is exported only as a type. It has no test id: it finds the tabs within its parent, the one named by the `name` option (a string or a pattern, matched against the accessible name, such as `Project 2 problems`) when it is set, and the `index` and `containing` options pick among them. */
class ProblemsTabPom extends Pom {
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
   * How many tabs its parent holds, whatever the `index`, `name` and `containing` options. A page object that lists them builds one `ProblemsTabPom` per index below this number.
   * @returns The number of tabs within the parent.
   */
  get count(): number {
    return this.searchBase.queryAllByRole("tab").length;
  }

  /**
   * Everything the tab says, which is its label followed by its count.
   * @returns The text of the tab.
   */
  get text(): string {
    return this.root.textContent;
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
   * What comes after the label, in order.
   * @returns `icon` for what holds an `svg`, `count` for the badge, which is an image, and `other` for anything else.
   */
  get partsAfterLabel(): ("icon" | "count" | "other")[] {
    return Array.from(this.root.childNodes)
      .slice(1)
      .map((node) => {
        if (!(node instanceof Element)) {
          return "other";
        }

        if (node.matches("svg") || node.querySelector("svg") !== null) {
          return "icon";
        }

        return node.getAttribute("role") === "img" ? "count" : "other";
      });
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

/** Page object of the body of the selected tab, a part of the panel: the page object of the panel builds it, so it is exported only as a type. It has no test id: it finds the tab panel within its parent, the one named by the `name` option (the accessible name of its tab) when it is set. */
class ProblemsTabPanelPom extends Pom {
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

/** Page object of the button that collapses or expands the panel, a part of the panel: the page object of the panel builds it, so it is exported only as a type. It has no test id: it finds the button by its label within its parent, whichever of the two it has, or the one named by the `name` option when it is set. */
class ProblemsToggleButtonPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const { name: accessibleName = TOGGLE_NAME } = this.options;

    return this.pickMatch(
      this.searchBase.queryAllByRole("button", { name: accessibleName }),
      `the role "button" named ${accessibleName}`
    );
  }

  /**
   * Whether assistive technology reads the button as a button with a given name, which is what it offers.
   * @param accessibleName What the button offers, such as `Collapse the problems`.
   * @returns True when the button is among the buttons of that name of the element that holds it.
   */
  isButtonNamed(accessibleName: string): boolean {
    return this.isNamed("button", accessibleName);
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
   * Whether assistive technology reads the panel as a region with a given name.
   * @param accessibleName The accessible name.
   * @returns True when the panel is among the regions of that name of the element that holds it, whatever the parent of the page object, which a pane that is this panel makes its own root.
   */
  isRegionNamed(accessibleName: string): boolean {
    return this.isNamed("region", accessibleName);
  }

  /**
   * The head of the panel, which is the first child of the panel.
   * @returns The page object of the head.
   */
  get head(): PaneHeadPom {
    return this.childPom(PaneHeadPom);
  }

  /**
   * The strip of tabs.
   * @returns The tab list, or null when the panel has none.
   */
  private get tablist(): HTMLElement | null {
    return this.scope.queryByRole("tablist");
  }

  /**
   * The name of the strip of tabs.
   * @returns The accessible name of the tab list, or null when the panel has no tab list.
   */
  get tablistName(): string | null {
    return this.accessibleNames("tablist")[0] ?? null;
  }

  /**
   * How many tabs the strip of tabs holds.
   * @returns The number of tabs inside the tab list, which is zero when the panel has none.
   */
  get tablistTabCount(): number {
    const { tablist } = this;

    return tablist === null ? 0 : within(tablist).queryAllByRole("tab").length;
  }

  /**
   * The tabs of the panel, in order.
   * @returns One page object for each tab.
   */
  get tabs(): ProblemsTabPom[] {
    const { count } = this.childPom(ProblemsTabPom);

    return Array.from({ length: count }, (_, index) =>
      this.childPom(ProblemsTabPom, { index })
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
    return this.tabs.find(({ isSelected }) => isSelected)?.text ?? null;
  }

  /**
   * Gets a tab by its accessible name.
   * @param accessibleName The accessible name of the tab, such as `Project 2 problems`, or a pattern.
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
   * The button that collapses or expands the panel, picked by what it offers.
   * @param accessibleName What the button offers, such as `Collapse the problems`.
   * @returns The page object of the button, which is not rendered while the panel offers the other one.
   */
  toggleNamed(accessibleName: string): ProblemsToggleButtonPom {
    return this.childPom(ProblemsToggleButtonPom, { name: accessibleName });
  }

  /**
   * What the buttons that collapse or expand the panel offer.
   * @returns The accessible name of each such button, in order: one while the panel works.
   */
  get toggleNames(): string[] {
    return this.accessibleNames("button").filter((buttonName) =>
      TOGGLE_NAME.test(buttonName)
    );
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

export type { ProblemsTabPanelPom, ProblemsTabPom, ProblemsToggleButtonPom };
