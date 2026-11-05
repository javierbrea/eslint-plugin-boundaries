import type { RefObject } from "react";

import type { ConfigProblem, TextRange } from "@/engine";
import type { ConfigEditorSnapshot, ConfigReveal } from "@/ui/state";

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
  /** Lines to mark until it is unset. */
  readonly highlight?: TextRange;
  /** Called with the whole text after each edit of the user. */
  readonly onChange: (config: string) => void;
};
