import { RangeSet, StateEffect, StateField } from "@codemirror/state";
import type {
  ChangeDesc,
  EditorState,
  Extension,
  Range as MarkedRange,
  Text as EditorText,
} from "@codemirror/state";
import {
  Decoration,
  EditorView,
  GutterMarker,
  gutterLineClass,
} from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view";

import { fitToDocument } from "@/domains/config/ui/helpers/editorDiagnostics";
import type { TextRange } from "@/domains/evaluation/helpers/engine";

import { HIGHLIGHT_CLASS } from "./editorHighlight.constants";

/** The offsets of the range that is highlighted. */
type HighlightRange = Pick<TextRange, "from" | "to">;

/** The range to highlight, or `undefined` to clear it. Only the offsets are read, and the ones past the end of the document are kept inside it */
export const setHighlight = StateEffect.define<HighlightRange | undefined>();

const LINE_DECORATION = Decoration.line({ class: HIGHLIGHT_CLASS });

/** Marks the gutter elements of the highlighted lines, so that the mark spans the whole row */
class HighlightMarker extends GutterMarker {
  public override elementClass = HIGHLIGHT_CLASS;
}

const GUTTER_MARKER = new HighlightMarker();

/**
 * Builds the decorations of the lines that a range touches.
 * @param text The text of the editor.
 * @param range The range to highlight, which is inside the text, or `undefined` for none.
 * @returns One line decoration for each line of the range.
 */
function createLineDecorations(
  text: EditorText,
  range: HighlightRange | undefined
): DecorationSet {
  if (range === undefined) {
    return Decoration.none;
  }
  const { from, to } = range;
  // `to` is after the last character, so it is the start of the next line when the range ends with a line break
  const lastLine = text.lineAt(Math.max(from, to - 1)).number;
  const decorations: MarkedRange<Decoration>[] = [];
  for (
    let lineNumber = text.lineAt(from).number;
    lineNumber <= lastLine;
    lineNumber++
  ) {
    decorations.push(LINE_DECORATION.range(text.line(lineNumber).from));
  }
  return Decoration.set(decorations);
}

/**
 * Moves a range through the changes of the text. The text typed at an end of the range is outside it, so that typing next to a policy does not make it grow.
 * @param range The range before the changes.
 * @param changes The changes of the transaction.
 * @returns The range after the changes, and `undefined` when they collapsed a range that had width: the text it marked was deleted or replaced. A range without width has nothing to collapse, and stays.
 */
function mapRange(
  range: HighlightRange,
  changes: ChangeDesc
): HighlightRange | undefined {
  const hasWidth = range.from < range.to;
  const from = changes.mapPos(range.from, 1);
  const to = changes.mapPos(range.to, hasWidth ? -1 : 1);

  return hasWidth && from >= to ? undefined : { from, to };
}

/** The range that is highlighted: the one that {@link setHighlight} gave, moved by each change of the text. A change that collapses it, such as the deletion of the policy or the replacement of the whole text, clears it */
export const highlightRangeField = StateField.define<
  HighlightRange | undefined
>({
  create: () => undefined,
  update(range, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(setHighlight)) {
        return effect.value === undefined
          ? undefined
          : fitToDocument(effect.value, transaction.newDoc.length);
      }
    }
    return range === undefined || !transaction.docChanged
      ? range
      : mapRange(range, transaction.changes);
  },
});

/** The line decorations of the highlight, drawn from the range of {@link highlightRangeField}: the lines it touches now, which includes the lines that the user added inside it */
export const highlightField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decorations, transaction) {
    const range = transaction.state.field(highlightRangeField);

    // A change of the text gives a range that is a new object, even when its offsets are the same
    return range === transaction.startState.field(highlightRangeField)
      ? decorations
      : createLineDecorations(transaction.state.doc, range);
  },
  provide: (field) => EditorView.decorations.from(field),
});

/**
 * Reads where the highlight is, to report it with an edit.
 * @param state The state of the editor.
 * @returns The range that is highlighted, with the line and the column of its start, or `null` when nothing is.
 */
export function getHighlightRange(state: EditorState): TextRange | null {
  const range = state.field(highlightRangeField);

  if (range === undefined) {
    return null;
  }

  const line = state.doc.lineAt(range.from);

  return {
    from: range.from,
    to: range.to,
    line: line.number,
    column: range.from - line.from + 1,
  };
}

/** The state of the highlight and its marks in the gutters. Set the range with {@link setHighlight} */
export const highlightExtension: Extension = [
  highlightRangeField,
  highlightField,
  gutterLineClass.compute([highlightField], (state) => {
    const markers: MarkedRange<GutterMarker>[] = [];
    state.field(highlightField).between(0, state.doc.length, (from) => {
      markers.push(GUTTER_MARKER.range(from));
    });
    return RangeSet.of(markers);
  }),
];
