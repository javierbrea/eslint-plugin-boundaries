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

/** The severity that the editor draws a problem with. */
export type ConfigEditorSeverity = "error" | "warning";

/** A problem as the editor holds it, which is what its tooltip is built from. */
export type ConfigEditorDiagnostic = {
  /** Where it starts, as an offset in the text. */
  readonly from: number;
  /** Where it ends, as an offset in the text. */
  readonly to: number;
  /** How it is drawn. */
  readonly severity: string;
  /** The title, the detail and the links, one per line. */
  readonly message: string;
};

/** The selection of the editor. */
export type ConfigEditorSelection = {
  /** The end of the selection that stays put, as an offset in the text. */
  readonly anchor: number;
  /** The end of the selection that moves, which is where the cursor is. */
  readonly head: number;
};

/** The transactions that the view dispatched since a recording started. */
export type ConfigEditorDispatchRecording = {
  /** How many transactions were dispatched. */
  readonly count: number;
  /** Whether any of them asked to scroll. */
  readonly scrolled: boolean;
  /** Whether any of them carried effects. */
  readonly hasEffects: boolean;
};

/** A request to scroll a range into view. */
export type ConfigEditorRevealRequest = {
  /** Where the range starts, as an offset in the text. */
  readonly from: number;
  /** Where the range ends, as an offset in the text. */
  readonly to: number;
  /** Where in the view the range is put. */
  readonly y?: string;
  /** The lines kept visible above the range. */
  readonly yMargin?: number;
};

/** The requests to scroll since a recording started. */
export type ConfigEditorRevealRecording = {
  /** The requests, in order. */
  readonly requests: readonly ConfigEditorRevealRequest[];
};

/** How many views were destroyed since a recording started. */
export type ConfigEditorDestroyRecording = {
  /** How many views were destroyed. */
  readonly count: number;
};

/** The scroll positions that views were asked for since a recording started. */
export type ConfigEditorScrollRecording = {
  /** How many times a view was asked for its scroll position. */
  readonly count: number;
  /** What each request returned, in order. */
  readonly values: readonly unknown[];
};
