import { EmptyNodePom } from "@/domains/shell/ui/molecules/EmptyNode/EmptyNode.pom";
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
}
