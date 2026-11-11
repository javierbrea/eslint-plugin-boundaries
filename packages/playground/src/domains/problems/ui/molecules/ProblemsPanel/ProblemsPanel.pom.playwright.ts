import type { Locator } from "@playwright/test";

import { Pom } from "@/shared/testing/pom/pom.playwright";
import { CountBadgePom } from "@/ui-kit/atoms/CountBadge/CountBadge.pom.playwright";

import { PROBLEMS_PANEL_TEST_ID } from "./ProblemsPanel.constants";

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
   * The badge with the count of the tab.
   * @returns The page object of the badge.
   */
  get badge(): CountBadgePom {
    return this.childPom(CountBadgePom);
  }
}

/** Page object of the body of the selected tab, a part of the panel, exported only as a type. No browser spec reaches it: it exists because the jsdom page object exports a class of this name, which `check:pom-parity` requires of this file too. */
class ProblemsTabPanelPom extends Pom {
  protected readonly defaultTestId = "";
}

/** Page object of the button that collapses or expands the panel, a part of the panel, exported only as a type. No browser spec reaches it: it exists because the jsdom page object exports a class of this name, which `check:pom-parity` requires of this file too. */
class ProblemsToggleButtonPom extends Pom {
  protected readonly defaultTestId = "";
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
}

export type { ProblemsTabPanelPom, ProblemsTabPom, ProblemsToggleButtonPom };
