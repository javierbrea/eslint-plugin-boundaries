import { DependencyDetailPom } from "@/domains/problems/ui/molecules/DependencyDetail/DependencyDetail.pom";
import { ProblemListPom } from "@/domains/problems/ui/molecules/ProblemList/ProblemList.pom";
import { ProblemNotePom } from "@/domains/problems/ui/molecules/ProblemNote/ProblemNote.pom";
import { ProblemsPanelPom } from "@/domains/problems/ui/molecules/ProblemsPanel/ProblemsPanel.pom";
import type {
  ProblemsTabPanelPom,
  ProblemsTabPom,
  ProblemsToggleButtonPom,
} from "@/domains/problems/ui/molecules/ProblemsPanel/ProblemsPanel.pom";
import { Pom } from "@/shared/testing/pom";

import { PROBLEMS_PANE_TEST_ID } from "./ProblemsPane.constants";

/** Page object of the problems pane, which is the panel with the notes and the list of the tab that shows, or the body of the dependency in focus. */
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
   * The first note above the problems of the tab that shows.
   * @returns The page object of the note, which is not rendered while the tab has none.
   */
  get note(): ProblemNotePom {
    return this.childPom(ProblemNotePom);
  }

  /**
   * How many notes the tab that shows has above its problems.
   * @returns The number of notes.
   */
  get noteCount(): number {
    return this.scope.queryAllByRole("note").length;
  }

  /**
   * The notes above the problems of the tab that shows, in order.
   * @returns One page object for each note.
   */
  get notes(): ProblemNotePom[] {
    return Array.from({ length: this.noteCount }, (_, index) =>
      this.childPom(ProblemNotePom, { index })
    );
  }

  /**
   * The body of the tab of a dependency.
   * @returns The page object of the body, which is not rendered while another tab shows.
   */
  get detail(): DependencyDetailPom {
    return this.childPom(DependencyDetailPom);
  }

  /**
   * The problems of the tab that shows.
   * @returns The page object of the list.
   */
  get list(): ProblemListPom {
    return this.childPom(ProblemListPom);
  }
}
