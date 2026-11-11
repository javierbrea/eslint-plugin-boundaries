import type { Locator } from "@playwright/test";

import { Pom } from "@/shared/testing/pom/pom.playwright";
import { CountBadgePom } from "@/ui-kit/atoms/CountBadge/CountBadge.pom.playwright";

import {
  COLLAPSE_PROBLEMS_LABEL,
  EXPAND_PROBLEMS_LABEL,
  PROBLEMS_PANEL_TEST_ID,
} from "./ProblemsPanel.constants";

/** The name of the button that collapses or expands the panel, whichever it offers. */
const TOGGLE_NAME = new RegExp(
  `^(${COLLAPSE_PROBLEMS_LABEL}|${EXPAND_PROBLEMS_LABEL})$`
);

/** Page object of a tab of the problems panel, a part of the panel: the page object of the panel builds it, so it is exported only as a type. It has no test id: it finds the tabs within its parent, the one named by the `name` option (a string or a pattern, matched against the accessible name, such as `Project 2 problems`) when it is set, and the `index` and `containing` options pick among them. */
class ProblemsTabPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): Locator {
    const { name: accessibleName } = this.options;

    return this.pickMatch(
      this.searchBase.getByRole(
        "tab",
        accessibleName === undefined
          ? {}
          : { name: accessibleName, exact: true }
      )
    );
  }

  /**
   * Everything the tab says, which is its label followed by its count. It reads once and does not wait.
   * @returns A promise of the text of the tab, such as `Project2`, which is empty when the tab is not in the page.
   */
  get text(): Promise<string> {
    return this.readText();
  }

  /**
   * Whether the tab is the selected one. It reads once and does not wait.
   * @returns A promise of true when its `aria-selected` attribute is `true`.
   */
  get isSelected(): Promise<boolean> {
    return this.readAttribute("aria-selected").then(
      (selected) => selected === "true"
    );
  }

  /**
   * The badge with the count of the tab.
   * @returns The page object of the badge.
   */
  get badge(): CountBadgePom {
    return this.childPom(CountBadgePom);
  }

  /** Presses the tab. */
  async select(): Promise<void> {
    await this.root.click();
  }
}

/** Page object of the body of the selected tab, a part of the panel: the page object of the panel builds it, so it is exported only as a type. It has no test id: it finds the tab panel within its parent, the one named by the `name` option (the accessible name of its tab) when it is set. */
class ProblemsTabPanelPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): Locator {
    const { name: accessibleName } = this.options;

    return this.pickMatch(
      this.searchBase.getByRole(
        "tabpanel",
        accessibleName === undefined
          ? {}
          : { name: accessibleName, exact: true }
      )
    );
  }

  /**
   * What the body holds. It reads once and does not wait.
   * @returns A promise of the text of the tab panel, which is empty when the panel is collapsed.
   */
  get text(): Promise<string> {
    return this.readText();
  }
}

/** Page object of the button that collapses or expands the panel, a part of the panel: the page object of the panel builds it, so it is exported only as a type. It has no test id: it finds the button by its label within its parent, whichever of the two it has, or the one named by the `name` option when it is set. */
class ProblemsToggleButtonPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): Locator {
    const { name: accessibleName = TOGGLE_NAME } = this.options;

    return this.pickMatch(
      this.searchBase.getByRole("button", {
        name: accessibleName,
        exact: true,
      })
    );
  }

  /** Presses the button. */
  async press(): Promise<void> {
    await this.root.click();
  }
}

/** Page object of the problems panel, in a browser. It finds its root by the test id of the panel, or by the `testId` option when a module that is this panel gives it another. */
export class ProblemsPanelPom extends Pom {
  protected readonly defaultTestId: string = PROBLEMS_PANEL_TEST_ID;

  /**
   * Gets a tab by its accessible name.
   * @param accessibleName The accessible name of the tab, such as `Project 2 problems`, or a pattern such as `/^Project/` for the tab of the project, whatever its count.
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
}

export type { ProblemsTabPanelPom, ProblemsTabPom, ProblemsToggleButtonPom };
