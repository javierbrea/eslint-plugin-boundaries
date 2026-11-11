import { ProblemsPanelPom } from "@/domains/problems/ui/molecules/ProblemsPanel/ProblemsPanel.pom.playwright";
import type { ProblemsTabPom } from "@/domains/problems/ui/molecules/ProblemsPanel/ProblemsPanel.pom.playwright";
import { Pom } from "@/shared/testing/pom/pom.playwright";

import { PROBLEMS_PANE_TEST_ID } from "./ProblemsPane.constants";

/** Page object of the problems pane, in a browser, which is the panel with the notes and the list of the tab that shows, or the body of the dependency in focus. */
export class ProblemsPanePom extends Pom {
  protected readonly defaultTestId = PROBLEMS_PANE_TEST_ID;

  /**
   * The panel the pane is, which has the same root element.
   * @returns The page object of the panel.
   */
  get panel(): ProblemsPanelPom {
    return this.childPom(ProblemsPanelPom, { root: this.root });
  }

  /**
   * Gets a tab of the panel by its accessible name. The tab of the project is there whatever is open, and its badge is the count of problems of the whole project: `tab(/^Project/).badge.count`.
   * @param accessibleName The accessible name of the tab, such as `Project 2 problems`, or a pattern.
   * @returns The page object of the tab.
   */
  tab(accessibleName: string | RegExp): ProblemsTabPom {
    return this.panel.tab(accessibleName);
  }
}
