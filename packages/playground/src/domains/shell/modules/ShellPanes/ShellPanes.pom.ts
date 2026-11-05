import { ProblemsPanePom } from "@/domains/problems/modules/ProblemsPane/ProblemsPane.pom";
import { ProjectPanePom } from "@/domains/project/modules/ProjectPane/ProjectPane.pom";
import { InspectorPanePom } from "@/domains/shell/modules/InspectorPane/InspectorPane.pom";
import { NodePanePom } from "@/domains/shell/modules/NodePane/NodePane.pom";
import { ShellRegionsPom } from "@/domains/shell/ui/templates/ShellRegions/ShellRegions.pom";
import { Pom } from "@/shared/testing/pom";

import { SHELL_PANES_TEST_ID } from "./ShellPanes.constants";

/** Page object of the shell panes, which are the regions with the panes of the store. */
export class ShellPanesPom extends Pom {
  protected readonly defaultTestId = SHELL_PANES_TEST_ID;

  /**
   * The regions the module is, which have the same root element.
   * @returns The page object of the regions.
   */
  get regions(): ShellRegionsPom {
    return this.childPom(ShellRegionsPom, { root: this.root });
  }

  /**
   * The project pane, on the left.
   * @returns The page object of the pane.
   */
  get project(): ProjectPanePom {
    return this.childPom(ProjectPanePom);
  }

  /**
   * The node pane, in the middle.
   * @returns The page object of the pane, which is the pane of the node in focus.
   */
  get node(): NodePanePom {
    return this.childPom(NodePanePom);
  }

  /**
   * The inspector pane, on the right.
   * @returns The page object of the pane.
   */
  get inspector(): InspectorPanePom {
    return this.childPom(InspectorPanePom);
  }

  /**
   * The problems pane, below the other three.
   * @returns The page object of the pane.
   */
  get problems(): ProblemsPanePom {
    return this.childPom(ProblemsPanePom);
  }
}
