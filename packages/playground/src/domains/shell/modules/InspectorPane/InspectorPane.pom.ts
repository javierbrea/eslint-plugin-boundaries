import { ConfigInspectorPom } from "@/domains/config/ui/molecules/ConfigInspector/ConfigInspector.pom";
import { FileInspectorPom } from "@/domains/files/ui/molecules/FileInspector/FileInspector.pom";
import { ProjectSummaryPom } from "@/domains/project/ui/molecules/ProjectSummary/ProjectSummary.pom";
import { InspectorLayoutPom } from "@/domains/shell/ui/templates/InspectorLayout/InspectorLayout.pom";
import { Pom } from "@/shared/testing/pom";

import { INSPECTOR_PANE_TEST_ID } from "./InspectorPane.constants";
import type { InspectorPaneShown } from "./InspectorPane.types";

/** Page object of the inspector pane, which is the layout with the inspector of the node in focus. */
export class InspectorPanePom extends Pom {
  protected readonly defaultTestId = INSPECTOR_PANE_TEST_ID;

  /**
   * What the pane describes.
   * @returns `file` for a file, `config` for the config and `project` when nothing is open.
   * @throws When the pane holds none of the inspectors.
   */
  get shown(): InspectorPaneShown {
    if (this.file.isRendered) {
      return "file";
    }
    if (this.config.isRendered) {
      return "config";
    }
    if (this.project.isRendered) {
      return "project";
    }
    throw new Error(`${this.constructor.name} found no inspector in its root`);
  }

  /**
   * The layout the pane is, which has the same root element.
   * @returns The page object of the layout.
   */
  get layout(): InspectorLayoutPom {
    return this.childPom(InspectorLayoutPom, { root: this.root });
  }

  /**
   * The inspector of a file.
   * @returns The page object of the file inspector, which is not rendered unless a file is in focus.
   */
  get file(): FileInspectorPom {
    return this.childPom(FileInspectorPom);
  }

  /**
   * The inspector of the config.
   * @returns The page object of the config inspector, which is not rendered unless the config is in focus.
   */
  get config(): ConfigInspectorPom {
    return this.childPom(ConfigInspectorPom);
  }

  /**
   * The summary of the sketch.
   * @returns The page object of the summary, which is not rendered unless nothing is in focus.
   */
  get project(): ProjectSummaryPom {
    return this.childPom(ProjectSummaryPom);
  }
}
