import type { Locator } from "@playwright/test";

import { CONFIG_NODE_TEST_ID } from "@/domains/config/modules/ConfigNode/ConfigNode.constants";
import { ConfigNodePom } from "@/domains/config/modules/ConfigNode/ConfigNode.pom.playwright";
import { FILE_NODE_TEST_ID } from "@/domains/files/modules/FileNode/FileNode.constants";
import { FileNodePom } from "@/domains/files/modules/FileNode/FileNode.pom.playwright";
import { EMPTY_NODE_PANE_TEST_ID } from "@/domains/shell/modules/EmptyNodePane/EmptyNodePane.constants";
import { Pom } from "@/shared/testing/pom/pom.playwright";

/** Which pane the node pane shows: a file, the config or nothing. */
type NodePaneShown = "file" | "config" | "empty";

/** The test id of the root element of each pane the node pane can show. */
const PANE_TEST_IDS: readonly (readonly [NodePaneShown, string])[] = [
  ["file", FILE_NODE_TEST_ID],
  ["config", CONFIG_NODE_TEST_ID],
  ["empty", EMPTY_NODE_PANE_TEST_ID],
];

/** Page object of the node pane, in a browser. The node pane renders no element of its own: its root is the pane of the node in focus, which has its own test id. So it has no default test id and finds the pane that is rendered by any of them. */
export class NodePanePom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): Locator {
    const testIds = PANE_TEST_IDS.map(([, testId]) => testId);

    return this.pickMatch(
      this.searchBase.getByTestId(new RegExp(`^(${testIds.join("|")})$`))
    );
  }

  /**
   * Which pane the node pane shows. It reads once and does not wait.
   * @returns A promise of `file` for the pane of a file, `config` for the config node and `empty` when nothing is open, or null when the node pane is not in the page.
   */
  get shown(): Promise<NodePaneShown | null> {
    return this.readAttribute("data-testid").then(
      (testId) =>
        PANE_TEST_IDS.find(([, paneTestId]) => paneTestId === testId)?.[0] ??
        null
    );
  }

  /**
   * The pane of the file in focus.
   * @returns The page object of the file node, which is the root element when a file is open and is not rendered otherwise.
   */
  get file(): FileNodePom {
    return this.childPom(FileNodePom, {
      root: this.root.and(this.page.getByTestId(FILE_NODE_TEST_ID)),
    });
  }

  /**
   * The config in focus.
   * @returns The page object of the config node, which is the root element when the config is open and is not rendered otherwise.
   */
  get config(): ConfigNodePom {
    return this.childPom(ConfigNodePom, {
      root: this.root.and(this.page.getByTestId(CONFIG_NODE_TEST_ID)),
    });
  }
}
