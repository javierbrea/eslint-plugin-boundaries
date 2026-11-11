import type { ProblemsPanePom } from "@/domains/problems/modules/ProblemsPane/ProblemsPane.pom.playwright";
import type { ProjectPanePom } from "@/domains/project/modules/ProjectPane/ProjectPane.pom.playwright";
import type { InspectorPanePom } from "@/domains/shell/modules/InspectorPane/InspectorPane.pom.playwright";
import type { NodePanePom } from "@/domains/shell/modules/NodePane/NodePane.pom.playwright";
import { ShellPanesPom } from "@/domains/shell/modules/ShellPanes/ShellPanes.pom.playwright";
import { ShellTopBarPom } from "@/domains/shell/modules/ShellTopBar/ShellTopBar.pom.playwright";
import { ShellLayoutPom } from "@/domains/shell/ui/templates/ShellLayout/ShellLayout.pom.playwright";
import { Pom } from "@/shared/testing/pom/pom.playwright";

import { SHELL_TEST_ID } from "./Shell.constants";

/** Page object of the shell, in a browser, which is its layout: the top bar and the panes. It composes the page objects of those pieces and has a shortcut for each pane. With several shells on the page, the `index` option picks one. */
export class ShellPom extends Pom {
  protected readonly defaultTestId = SHELL_TEST_ID;

  /**
   * The layout the shell is, which has the same root element.
   * @returns The page object of the layout.
   */
  get layout(): ShellLayoutPom {
    return this.childPom(ShellLayoutPom, { root: this.root });
  }

  /**
   * The top bar, with the numbers of the store.
   * @returns The page object of the top bar.
   */
  get topBar(): ShellTopBarPom {
    return this.childPom(ShellTopBarPom);
  }

  /**
   * The panes, laid out in their regions.
   * @returns The page object of the panes.
   */
  get panes(): ShellPanesPom {
    return this.childPom(ShellPanesPom);
  }

  /**
   * The project pane.
   * @returns The page object of the pane.
   */
  get project(): ProjectPanePom {
    return this.panes.project;
  }

  /**
   * The node pane, which shows the node in focus.
   * @returns The page object of the pane.
   */
  get node(): NodePanePom {
    return this.panes.node;
  }

  /**
   * The inspector pane.
   * @returns The page object of the pane.
   */
  get inspector(): InspectorPanePom {
    return this.panes.inspector;
  }

  /**
   * The problems pane.
   * @returns The page object of the pane.
   */
  get problems(): ProblemsPanePom {
    return this.panes.problems;
  }
}
