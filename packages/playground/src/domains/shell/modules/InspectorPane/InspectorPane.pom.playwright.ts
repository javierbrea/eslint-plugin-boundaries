import { FileInspectorPom } from "@/domains/files/ui/organisms/FileInspector/FileInspector.pom.playwright";
import { Pom } from "@/shared/testing/pom/pom.playwright";

import { INSPECTOR_PANE_TEST_ID } from "./InspectorPane.constants";

/** Page object of the inspector pane, in a browser, which is the layout with the inspector of the node in focus. */
export class InspectorPanePom extends Pom {
  protected readonly defaultTestId = INSPECTOR_PANE_TEST_ID;

  /**
   * The inspector of a file.
   * @returns The page object of the file inspector, which is not rendered unless a file is in focus.
   */
  get file(): FileInspectorPom {
    return this.childPom(FileInspectorPom);
  }
}
