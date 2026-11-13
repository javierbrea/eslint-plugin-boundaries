import type { RefObject } from "react";

import type { ConfigEditorSnapshot } from "@/domains/config/ui/contexts/ConfigEditorSnapshotContext";
import type {
  ConfigProblem,
  TextRange,
} from "@/domains/evaluation/helpers/engine";
import type { ConfigReveal } from "@/domains/session/helpers/focus";

/** Props of the config pane. */
export type ConfigPaneProps = {
  /** The config text. */
  readonly config: string;
  /** The problems of the config. Pass the array of the evaluation as it is: the editor marks them again only when the array changes. */
  readonly problems: readonly ConfigProblem[];
  /** The text can be selected and copied, and not edited. */
  readonly readOnly: boolean;
  /** Scrolls the editor to a range each time its key changes. */
  readonly reveal?: ConfigReveal;
  /** Where the editor leaves its snapshot when the pane closes and starts from when it opens again, so that the undo history, the selection and the scroll survive opening a file. */
  readonly snapshot?: RefObject<ConfigEditorSnapshot | undefined>;
  /** The range to mark until it is unset: the editor marks the lines it touches and moves the range with the edits of the user. */
  readonly highlight?: TextRange;
  /** Called after each edit of the user with the whole text and with where the highlight is after it: its range, moved by the edit, or `null` when the editor has none. */
  readonly onChange: (config: string, highlight: TextRange | null) => void;
  /** Called when the user presses the close button of the head. */
  readonly onClose: () => void;
  /** The accessible name of the landmark of the pane. */
  readonly frameLabel: string;
  /** The test id of the root element. It is the one of the pane when it is unset, and a module that is this pane gives it its own. */
  readonly testId?: string;
};
