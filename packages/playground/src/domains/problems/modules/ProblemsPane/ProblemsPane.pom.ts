import { ProblemListPom } from "@/domains/problems/ui/molecules/ProblemList/ProblemList.pom";
import { ProblemsPanelPom } from "@/domains/problems/ui/molecules/ProblemsPanel/ProblemsPanel.pom";
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
