import type { ConfigProblem, TextRange } from "../../engine";

/** A request to show a range of the config: the editor scrolls to it and puts the cursor at its start each time the key changes */
export type ConfigEditorReveal = {
  /** The range to show */
  readonly range: TextRange;
  /** Changes for each request, so that the same range can be shown again after the user scrolled away */
  readonly key: number;
};

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
  /** Scrolls to a range when its key changes */
  readonly reveal?: ConfigEditorReveal;
};
