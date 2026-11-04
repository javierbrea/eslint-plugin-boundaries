import type { EditorState, StateEffect } from "@codemirror/state";
import type { ReactNode, RefObject } from "react";

import type { ProjectCapabilities, Sketch } from "../../contract";

import type { WorkbenchStore } from "./Store.types";

/** What the config editor leaves when the config closes, so that it opens again as the user left it. CodeMirror state is not serializable, so it is kept next to the store and not in it. */
export type ConfigEditorSnapshot = {
  /** The document, the selection and the undo history. */
  readonly state: EditorState;
  /** Where the editor was scrolled, as `EditorView.scrollSnapshot` returns it. */
  readonly scroll: StateEffect<unknown>;
};

/** What the hooks of `ui/state` read from the provider. */
export type WorkbenchContextValue = {
  /** The store of the instance. */
  readonly store: WorkbenchStore;
  /** What the user can change in the project. */
  readonly capabilities: ProjectCapabilities;
  /** Where the config editor leaves its snapshot when the config closes. */
  readonly configEditor: RefObject<ConfigEditorSnapshot | undefined>;
};

/** Props of {@link WorkbenchProvider}. */
export type WorkbenchProviderProps = {
  /** The sketch to start from. A later value is ignored: the store owns the sketch from then on, and a host that shows another sketch mounts the workbench again. */
  readonly initialSketch: Sketch;
  /** What the user can change in the project. */
  readonly capabilities: ProjectCapabilities;
  /** Called with each new sketch after an edit, and never with the first one. */
  readonly onSketchChange: (sketch: Sketch) => void;
  /** The panes. */
  readonly children: ReactNode;
};
