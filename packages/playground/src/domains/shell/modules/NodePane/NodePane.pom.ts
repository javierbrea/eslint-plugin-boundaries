import { CONFIG_NODE_TEST_ID } from "@/domains/config/modules/ConfigNode/ConfigNode.constants";
import { ConfigNodePom } from "@/domains/config/modules/ConfigNode/ConfigNode.pom";
import { FILE_NODE_TEST_ID } from "@/domains/files/modules/FileNode/FileNode.constants";
import { FileNodePom } from "@/domains/files/modules/FileNode/FileNode.pom";
import { EMPTY_NODE_PANE_TEST_ID } from "@/domains/shell/modules/EmptyNodePane/EmptyNodePane.constants";
import { EmptyNodePanePom } from "@/domains/shell/modules/EmptyNodePane/EmptyNodePane.pom";
import { Pom } from "@/shared/testing/pom";
import type { PomOptions } from "@/shared/testing/pom";
import { PaneFramePom } from "@/ui-kit/atoms/PaneFrame/PaneFrame.pom";

import type { NodePaneShown } from "./NodePane.types";

/** The test id of the root element of each pane the node pane can show. */
const PANE_TEST_IDS: readonly (readonly [NodePaneShown, string])[] = [
  ["file", FILE_NODE_TEST_ID],
  ["config", CONFIG_NODE_TEST_ID],
  ["empty", EMPTY_NODE_PANE_TEST_ID],
];

/** Page object of the node pane. The node pane renders no element of its own: its root is the pane of the node in focus, which has its own test id. So it has no default test id and finds the pane that is rendered by any of them. Only one pane shows at a time: it throws when two of them are rendered together. */
export class NodePanePom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const testIds = PANE_TEST_IDS.map(([, testId]) => testId);
    const candidates = this.searchBase.queryAllByTestId(
      new RegExp(`^(${testIds.join("|")})$`)
    );
    const rendered = new Set(
      candidates.map((candidate) => candidate.getAttribute("data-testid"))
    );

    if (rendered.size > 1) {
      throw new Error(
        `${this.constructor.name} found ${rendered.size} panes rendered at once (${[...rendered].join(", ")}), and only the pane of the node in focus shows`
      );
    }

    return this.pickMatch(
      candidates,
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
   * Builds the page object of the pane that shows, which has the same root element.
   * @param kind The kind of pane the page object is of.
   * @param Ctor The class of the page object.
   * @returns The page object of the pane.
   * @throws When the node pane shows another kind of pane.
   */
  private paneOf<T extends Pom>(
    kind: NodePaneShown,
    Ctor: new (options: PomOptions) => T
  ): T {
    const { shown } = this;

    if (shown !== kind) {
      throw new Error(
        `${this.constructor.name} shows the ${shown} pane, not the ${kind} pane`
      );
    }

    return this.childPom(Ctor, { root: this.root });
  }

  /**
   * The pane of the file in focus.
   * @returns The page object of the file node, which is the root element when a file is open.
   * @throws When a file is not open.
   */
  get file(): FileNodePom {
    return this.paneOf("file", FileNodePom);
  }

  /**
   * The config in focus.
   * @returns The page object of the config node, which is the root element when the config is open.
   * @throws When the config is not open.
   */
  get config(): ConfigNodePom {
    return this.paneOf("config", ConfigNodePom);
  }

  /**
   * The pane that shows when nothing is open.
   * @returns The page object of the empty node pane, which is the root element when nothing is open.
   * @throws When something is open.
   */
  get empty(): EmptyNodePanePom {
    return this.paneOf("empty", EmptyNodePanePom);
  }
}
