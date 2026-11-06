import type { EditorState, StateEffect } from "@codemirror/state";

/** What the config editor leaves when the config closes, so that it opens again as the user left it. CodeMirror state is not serializable, so it is kept in a context of the config ui and not in the store. */
export type ConfigEditorSnapshot = {
  /** The document, the selection and the undo history. */
  readonly state: EditorState;
  /** Where the editor was scrolled, as `EditorView.scrollSnapshot` returns it. */
  readonly scroll: StateEffect<unknown>;
};
