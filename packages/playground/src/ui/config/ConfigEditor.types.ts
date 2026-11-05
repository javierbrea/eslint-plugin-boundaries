import type { RefObject } from "react";

import type { ConfigEditorSnapshot } from "@/domains/config/ui/contexts/ConfigEditorSnapshotContext";
import type {
  ConfigProblem,
  TextRange,
} from "@/domains/evaluation/helpers/engine";
import type { ConfigReveal } from "@/domains/session/helpers/focus";

/** Props of {@link ConfigEditor}. */
export type ConfigEditorProps = {
  /** The config text. A value that differs from the document replaces it, and is not reported back through `onChange` */
  readonly value: string;
  /** Called with the whole text after each edit of the user */
  readonly onChange: (value: string) => void;
  /** The problems of the config, underlined at their ranges and marked in the gutter */
  readonly problems: readonly ConfigProblem[];
  /** The accessible name of the editor */
  readonly label: string;
  /** The text can be selected and copied, and not edited */
  readonly readOnly?: boolean;
  /** Lines to mark until it is unset, such as the policy that "Open policy in config" points at. It is read when its offsets change; the lines follow the edits of the user, and are dropped when `value` replaces the text */
  readonly highlight?: TextRange;
  /** Scrolls to a range and puts the cursor at its start when its key changes */
  readonly reveal?: ConfigReveal;
  /** Where the editor leaves its state and its scroll when it unmounts, and starts from when it mounts again: the undo history, the selection and the scroll survive closing the config. Without it the editor starts from `value` each time */
  readonly snapshot?: RefObject<ConfigEditorSnapshot | undefined>;
};
