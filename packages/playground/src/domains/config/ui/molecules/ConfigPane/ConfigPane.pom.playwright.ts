import { ConfigEditorPom } from "@/domains/config/ui/atoms/ConfigEditor/ConfigEditor.pom.playwright";
import { Pom } from "@/shared/testing/pom/pom.playwright";
import { PaneHeadPom } from "@/ui-kit/atoms/PaneHead/PaneHead.pom.playwright";

import { CONFIG_PANE_TEST_ID } from "./ConfigPane.constants";

/** Page object of the config pane, in a browser. It finds its root by the test id of the pane, or by the `testId` option when a module that is this pane gives it another. */
export class ConfigPanePom extends Pom {
  protected readonly defaultTestId: string = CONFIG_PANE_TEST_ID;

  /**
   * The head of the pane, with the name of the file and the hint, which is the first child of the frame.
   * @returns The page object of the head.
   */
  get head(): PaneHeadPom {
    return this.childPom(PaneHeadPom);
  }

  /**
   * The first code editor of the pane.
   * @returns The page object of the editor.
   */
  get editor(): ConfigEditorPom {
    return this.childPom(ConfigEditorPom);
  }

  /**
   * Gets the code editor that has an accessible name.
   * @param accessibleName The name of the editor.
   * @returns The page object of the editor.
   */
  editorNamed(accessibleName: string): ConfigEditorPom {
    return this.childPom(ConfigEditorPom, { name: accessibleName });
  }
}
