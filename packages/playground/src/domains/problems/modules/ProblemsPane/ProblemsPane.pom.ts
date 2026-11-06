import { ProblemListPom } from "@/domains/problems/ui/molecules/ProblemList/ProblemList.pom";
import { ProblemsPanelPom } from "@/domains/problems/ui/molecules/ProblemsPanel/ProblemsPanel.pom";
import type {
  ProblemsTabPanelPom,
  ProblemsTabPom,
  ProblemsToggleButtonPom,
} from "@/domains/problems/ui/molecules/ProblemsPanel/ProblemsPanel.pom";
import { RulesNotePom } from "@/domains/problems/ui/molecules/RulesNote/RulesNote.pom";
import { Pom } from "@/shared/testing/pom";

import { PROBLEMS_PANE_TEST_ID } from "./ProblemsPane.constants";

/** Page object of the problems pane, which is the panel with the note and the list of the tab that shows. */
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
   * The tabs of the panel, in order.
   * @returns One page object for each tab.
   */
  get tabs(): ProblemsTabPom[] {
    return this.panel.tabs;
  }

  /**
   * Gets a tab of the panel by its accessible name.
   * @param accessibleName The accessible name of the tab, such as `Sketch 2 problems`, or a pattern.
   * @returns The page object of the tab.
   */
  tab(accessibleName: string | RegExp): ProblemsTabPom {
    return this.panel.tab(accessibleName);
  }

  /**
   * Gets the body of the selected tab.
   * @returns The page object of the tab panel, which is not rendered while the panel is collapsed.
   */
  get tabPanel(): ProblemsTabPanelPom {
    return this.panel.tabPanel();
  }

  /**
   * The button that collapses or expands the panel, picked by what it offers.
   * @param accessibleName What the button offers, such as `Collapse the problems`.
   * @returns The page object of the button, which is not rendered while the panel offers the other one.
   */
  toggleNamed(accessibleName: string): ProblemsToggleButtonPom {
    return this.panel.toggleNamed(accessibleName);
  }

  /**
   * The note that says the rules are not evaluated.
   * @returns The page object of the note, which is not rendered while the rule options are valid.
   */
  get note(): RulesNotePom {
    return this.childPom(RulesNotePom);
  }

  /**
   * The problems of the tab that shows.
   * @returns The page object of the list.
   */
  get list(): ProblemListPom {
    return this.childPom(ProblemListPom);
  }
}
