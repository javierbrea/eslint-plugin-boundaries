import type { ConfigEditorPom } from "@/domains/config/ui/atoms/ConfigEditor/ConfigEditor.pom";
import { ConfigPanePom } from "@/domains/config/ui/molecules/ConfigPane/ConfigPane.pom";
import { Pom } from "@/shared/testing/pom";

import { CONFIG_NODE_TEST_ID } from "./ConfigNode.constants";

/** Page object of the config node, which is the config pane with the config of the store. */
export class ConfigNodePom extends Pom {
  protected readonly defaultTestId = CONFIG_NODE_TEST_ID;

  /**
   * The pane the node is, which has the same root element.
   * @returns The page object of the config pane.
   */
  get pane(): ConfigPanePom {
    return this.childPom(ConfigPanePom, { root: this.root });
  }

  /**
   * The editor of the config.
   * @returns The page object of the editor.
   */
  get editor(): ConfigEditorPom {
    return this.pane.editor;
  }
}
