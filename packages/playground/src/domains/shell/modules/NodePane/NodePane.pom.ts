import { CONFIG_NODE_TEST_ID } from "@/domains/config/modules/ConfigNode/ConfigNode.constants";
import { ConfigNodePom } from "@/domains/config/modules/ConfigNode/ConfigNode.pom";
import { FILE_PANE_TEST_ID } from "@/domains/files/ui/molecules/FilePane/FilePane.constants";
import { FilePanePom } from "@/domains/files/ui/molecules/FilePane/FilePane.pom";
import { EMPTY_NODE_PANE_TEST_ID } from "@/domains/shell/modules/EmptyNodePane/EmptyNodePane.constants";
import { EmptyNodePanePom } from "@/domains/shell/modules/EmptyNodePane/EmptyNodePane.pom";
import { Pom } from "@/shared/testing/pom";
import { PaneFramePom } from "@/ui-kit/atoms/PaneFrame/PaneFrame.pom";

import type { NodePaneShown } from "./NodePane.types";

/** The test id of the root element of each pane the node pane can show. */
const PANE_TEST_IDS: readonly (readonly [NodePaneShown, string])[] = [
  ["file", FILE_PANE_TEST_ID],
  ["config", CONFIG_NODE_TEST_ID],
  ["empty", EMPTY_NODE_PANE_TEST_ID],
];

/** Page object of the node pane. The node pane renders no element of its own: its root is the pane of the node in focus, which has its own test id. So it has no default test id and finds the pane that is rendered by any of them. */
export class NodePanePom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const testIds = PANE_TEST_IDS.map(([, testId]) => testId);

    return this.pickMatch(
      this.searchBase.queryAllByTestId(new RegExp(`^(${testIds.join("|")})$`)),
      `the test id of a pane of the node in focus (${testIds.join(", ")})`
    );
  }

  /**
   * Which pane the node pane shows.
   * @returns `file` for the pane of a file, `config` for the config node and `empty` when nothing is open.
   * @throws When the root is none of the panes, which the search of the root rules out.
   */
  get shown(): NodePaneShown {
    const testId = this.root.getAttribute("data-testid");
    const pane = PANE_TEST_IDS.find(([, paneTestId]) => paneTestId === testId);

    if (pane === undefined) {
      throw new Error(
        `${this.constructor.name} found the test id "${testId}" in its root`
      );
    }

    return pane[0];
  }

  /**
   * The landmark of the pane that shows, which is the root element.
   * @returns The page object of the frame.
   */
  get frame(): PaneFramePom {
    return this.childPom(PaneFramePom, { root: this.root });
  }

  /**
   * The pane of the file in focus.
   * @returns The page object of the file pane, which is the root element when a file is open.
   */
  get file(): FilePanePom {
    return this.childPom(FilePanePom, { root: this.root });
  }

  /**
   * The config in focus.
   * @returns The page object of the config node, which is the root element when the config is open.
   */
  get config(): ConfigNodePom {
    return this.childPom(ConfigNodePom, { root: this.root });
  }

  /**
   * The pane that shows when nothing is open.
   * @returns The page object of the empty node pane, which is the root element when nothing is open.
   */
  get empty(): EmptyNodePanePom {
    return this.childPom(EmptyNodePanePom, { root: this.root });
  }
}
