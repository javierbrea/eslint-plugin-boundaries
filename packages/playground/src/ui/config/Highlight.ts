import { RangeSet, StateEffect, StateField } from "@codemirror/state";
import type {
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

import type { TextRange } from "@/domains/evaluation/helpers/engine";

import { fitToDocument } from "./Diagnostics";

/** The class of the highlighted lines, and of their gutter elements, which the theme styles */
export const HIGHLIGHT_CLASS = "cm-jsb-highlight";

/** The lines to highlight, or `undefined` to clear them. Only the offsets are read */
export const setHighlight = StateEffect.define<
  Pick<TextRange, "from" | "to"> | undefined
>();

const LINE_DECORATION = Decoration.line({ class: HIGHLIGHT_CLASS });

/** Marks the gutter elements of the highlighted lines, so that the mark spans the whole row */
class HighlightMarker extends GutterMarker {
  public override elementClass = HIGHLIGHT_CLASS;
}

const GUTTER_MARKER = new HighlightMarker();

/**
 * Builds the decorations of the lines that a range touches.
 * @param text The text of the editor.
 * @param range The range to highlight, or `undefined` for none.
 * @returns One line decoration for each line of the range.
 */
function createLineDecorations(
  text: EditorText,
  range: Pick<TextRange, "from" | "to"> | undefined
): DecorationSet {
  if (range === undefined) {
    return Decoration.none;
  }
  const { from, to } = fitToDocument(range, text.length);
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

/** The line decorations of the highlight. They follow the lines through the edits of the user, until the highlight is set again */
export const highlightField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decorations, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(setHighlight)) {
        return createLineDecorations(transaction.state.doc, effect.value);
      }
    }
    return decorations.map(transaction.changes);
  },
  provide: (field) => EditorView.decorations.from(field),
});

/** The state of the highlight and its marks in the gutters. Set the lines with {@link setHighlight} */
export const highlightExtension: Extension = [
  highlightField,
  gutterLineClass.compute([highlightField], (state) => {
    const markers: MarkedRange<GutterMarker>[] = [];
    state.field(highlightField).between(0, state.doc.length, (from) => {
      markers.push(GUTTER_MARKER.range(from));
    });
    return RangeSet.of(markers);
  }),
];
