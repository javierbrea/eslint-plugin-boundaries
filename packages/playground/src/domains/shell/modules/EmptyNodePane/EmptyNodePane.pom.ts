import { EmptyNodePom } from "@/domains/shell/ui/molecules/EmptyNode/EmptyNode.pom";
import type { EmptyNodeButtonPom } from "@/domains/shell/ui/molecules/EmptyNode/EmptyNode.pom";
import { Pom } from "@/shared/testing/pom";

import { EMPTY_NODE_PANE_TEST_ID } from "./EmptyNodePane.constants";

/** Page object of the empty node pane, which is the empty node with the actions of the store. */
export class EmptyNodePanePom extends Pom {
  protected readonly defaultTestId = EMPTY_NODE_PANE_TEST_ID;

  /**
   * The pane the module is, which has the same root element.
   * @returns The page object of the empty node.
   */
  get node(): EmptyNodePom {
    return this.childPom(EmptyNodePom, { root: this.root });
  }

  /**
   * What the pane asks of the user, which is the title of the empty node.
   * @returns The text of the heading.
   */
  get title(): string {
    return this.node.title;
  }

  /**
   * The button that adds a file, which is the one of the empty node.
   * @returns The page object of the button, which is not rendered while the project cannot have files added.
   */
  get addFileButton(): EmptyNodeButtonPom {
    return this.node.addFileButton;
  }

  /**
   * The button that opens the config, which is the one of the empty node.
   * @returns The page object of the button.
   */
  get openConfigButton(): EmptyNodeButtonPom {
    return this.node.openConfigButton;
  }
}
