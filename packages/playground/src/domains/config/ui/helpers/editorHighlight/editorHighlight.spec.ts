import { EditorState } from "@codemirror/state";
import { gutterLineClass } from "@codemirror/view";

import type { TextRange } from "@/domains/evaluation/helpers/engine";

import {
  getHighlightRange,
  highlightExtension,
  highlightField,
  highlightRangeField,
  setHighlight,
} from "./editorHighlight";
import { HIGHLIGHT_CLASS } from "./editorHighlight.constants";

const TEXT = ["{", "  settings: {},", "  rules: {},", "}"].join("\n");

/**
 * Creates the state of an editor that has the highlight.
 * @param doc The text of the editor.
 * @returns The state.
 */
function createState(doc = TEXT): EditorState {
  return EditorState.create({ doc, extensions: [highlightExtension] });
}

/**
 * Reads the lines that the line decorations of the highlight are on.
 * @param state The state of the editor.
 * @returns The line numbers, from 1.
 */
function getHighlightedLines(state: EditorState): number[] {
  const lines: number[] = [];
  state.field(highlightField).between(0, state.doc.length, (from) => {
    lines.push(state.doc.lineAt(from).number);
  });
  return lines;
}

/**
 * Reads the lines whose gutter elements get the class of the highlight.
 * @param state The state of the editor.
 * @returns The line numbers, from 1.
 */
function getMarkedGutterLines(state: EditorState): number[] {
  const lines: number[] = [];
  for (const markers of state.facet(gutterLineClass)) {
    markers.between(0, state.doc.length, (from, _to, marker) => {
      expect(marker.elementClass).toBe(HIGHLIGHT_CLASS);

      lines.push(state.doc.lineAt(from).number);
    });
  }
  return lines;
}

/**
 * Finds a range in the text.
 * @param snippet The text to look for.
 * @returns The offsets of the snippet.
 */
function rangeOf(snippet: string): { from: number; to: number } {
  const from = TEXT.indexOf(snippet);
  return { from, to: from + snippet.length };
}

describe("editorHighlight", () => {
  describe("highlightField", () => {
    it("should start without highlighted lines", () => {
      // Arrange
      const state = createState();

      // Act
      const lines = getHighlightedLines(state);

      // Assert
      expect(lines).toEqual([]);
    });

    it("should mark the line of a range that is inside one line", () => {
      // Arrange
      const state = createState();

      // Act
      const next = state.update({
        effects: setHighlight.of(rangeOf("rules")),
      }).state;

      // Assert
      expect(getHighlightedLines(next)).toEqual([3]);
    });

    it("should mark every line that a range touches", () => {
      // Arrange
      const state = createState();

      // Act
      const next = state.update({
        effects: setHighlight.of({
          from: rangeOf("settings").from,
          to: TEXT.length,
        }),
      }).state;

      // Assert
      expect(getHighlightedLines(next)).toEqual([2, 3, 4]);
    });

    it("should not mark the next line when the range ends with a line break", () => {
      // Arrange
      const state = createState();
      const { from } = rangeOf("  settings");
      const to = from + "  settings: {},\n".length;

      // Act
      const next = state.update({
        effects: setHighlight.of({ from, to }),
      }).state;

      // Assert
      expect(getHighlightedLines(next)).toEqual([2]);
    });

    it("should mark the line of a range without width", () => {
      // Arrange
      const state = createState();
      const { from } = rangeOf("rules");

      // Act
      const next = state.update({
        effects: setHighlight.of({ from, to: from }),
      }).state;

      // Assert
      expect(getHighlightedLines(next)).toEqual([3]);
    });

    it("should mark up to the last line when the range ends after the document", () => {
      // Arrange
      const state = createState();

      // Act
      const next = state.update({
        effects: setHighlight.of({ from: rangeOf("rules").from, to: 1000 }),
      }).state;

      // Assert
      expect(getHighlightedLines(next)).toEqual([3, 4]);
    });

    it("should replace the lines when the highlight is set again", () => {
      // Arrange
      const marked = createState().update({
        effects: setHighlight.of(rangeOf("settings")),
      }).state;

      // Act
      const next = marked.update({
        effects: setHighlight.of(rangeOf("rules")),
      }).state;

      // Assert
      expect(getHighlightedLines(next)).toEqual([3]);
    });

    it("should clear the lines when the highlight is unset", () => {
      // Arrange
      const marked = createState().update({
        effects: setHighlight.of(rangeOf("settings")),
      }).state;

      // Act
      const next = marked.update({ effects: setHighlight.of(undefined) }).state;

      // Assert
      expect(getHighlightedLines(next)).toEqual([]);
    });

    it("should keep the lines through the edits of the user, and move them with the text", () => {
      // Arrange
      const marked = createState().update({
        effects: setHighlight.of(rangeOf("settings")),
      }).state;

      // Act
      const next = marked.update({
        changes: { from: 0, insert: "// config\n" },
      }).state;

      // Assert
      expect(getHighlightedLines(next)).toEqual([3]);
    });
  });

  describe("highlightField, drawn from the range", () => {
    it("should mark the lines that the text added inside the range makes it touch", () => {
      // Arrange
      const marked = createState().update({
        effects: setHighlight.of(rangeOf("settings: {},")),
      }).state;

      // Act
      const next = marked.update({
        changes: {
          from: rangeOf("{},").from + 1,
          insert: "\n  a: 1,\n  b: 2,",
        },
      }).state;

      // Assert
      expect(getHighlightedLines(next)).toEqual([2, 3, 4]);
    });

    it("should clear the lines when the changes delete the range", () => {
      // Arrange
      const marked = createState().update({
        effects: setHighlight.of(rangeOf("settings")),
      }).state;
      const { from, to } = rangeOf("settings");

      // Act
      const next = marked.update({ changes: { from, to } }).state;

      // Assert
      expect(getHighlightedLines(next)).toEqual([]);
      expect(getMarkedGutterLines(next)).toEqual([]);
    });
  });

  describe("highlightRangeField", () => {
    it("should start without a range", () => {
      // Arrange
      const state = createState();

      // Act
      const range = state.field(highlightRangeField);

      // Assert
      expect(range).toBeUndefined();
    });

    it("should hold the range that was set", () => {
      // Arrange
      const state = createState();

      // Act
      const next = state.update({
        effects: setHighlight.of(rangeOf("settings")),
      }).state;

      // Assert
      expect(next.field(highlightRangeField)).toEqual(rangeOf("settings"));
    });

    it("should hold only the offsets of the range that was set", () => {
      // Arrange
      const state = createState();
      const { from, to } = rangeOf("settings");
      const given: TextRange = { from, to, line: 9, column: 9 };

      // Act
      const next = state.update({ effects: setHighlight.of(given) }).state;

      // Assert
      expect(next.field(highlightRangeField)).toStrictEqual({ from, to });
    });

    it("should keep the range of a document that ends before it inside the document", () => {
      // Arrange
      const state = createState();

      // Act
      const next = state.update({
        effects: setHighlight.of({ from: rangeOf("rules").from, to: 1000 }),
      }).state;

      // Assert
      expect(next.field(highlightRangeField)).toEqual({
        from: rangeOf("rules").from,
        to: TEXT.length,
      });
    });

    it("should forget the range when the highlight is unset", () => {
      // Arrange
      const marked = createState().update({
        effects: setHighlight.of(rangeOf("settings")),
      }).state;

      // Act
      const next = marked.update({ effects: setHighlight.of(undefined) }).state;

      // Assert
      expect(next.field(highlightRangeField)).toBeUndefined();
    });

    it("should replace the range when the highlight is set again", () => {
      // Arrange
      const marked = createState().update({
        effects: setHighlight.of(rangeOf("settings")),
      }).state;

      // Act
      const next = marked.update({
        effects: setHighlight.of(rangeOf("rules")),
      }).state;

      // Assert
      expect(next.field(highlightRangeField)).toEqual(rangeOf("rules"));
    });

    it("should not change the range for a transaction that changes nothing", () => {
      // Arrange
      const marked = createState().update({
        effects: setHighlight.of(rangeOf("settings")),
      }).state;

      // Act
      const next = marked.update({ selection: { anchor: 3 } }).state;

      // Assert
      expect(next.field(highlightRangeField)).toBe(
        marked.field(highlightRangeField)
      );
    });

    it("should move the range with the text added before it", () => {
      // Arrange
      const marked = createState().update({
        effects: setHighlight.of(rangeOf("settings")),
      }).state;

      // Act
      const next = marked.update({
        changes: { from: 0, insert: "// config\n" },
      }).state;

      // Assert
      const { from, to } = rangeOf("settings");

      expect(next.field(highlightRangeField)).toEqual({
        from: from + 10,
        to: to + 10,
      });
    });

    it("should not move the range for text added after it", () => {
      // Arrange
      const marked = createState().update({
        effects: setHighlight.of(rangeOf("settings")),
      }).state;

      // Act
      const next = marked.update({
        changes: { from: TEXT.length, insert: "\n// end" },
      }).state;

      // Assert
      expect(next.field(highlightRangeField)).toEqual(rangeOf("settings"));
    });

    it("should grow the range with the text added inside it", () => {
      // Arrange
      const marked = createState().update({
        effects: setHighlight.of(rangeOf("settings")),
      }).state;
      const { from, to } = rangeOf("settings");

      // Act
      const next = marked.update({
        changes: { from: from + 3, insert: "XY" },
      }).state;

      // Assert
      expect(next.field(highlightRangeField)).toEqual({ from, to: to + 2 });
    });

    it("should leave the text typed at its start out of the range", () => {
      // Arrange
      const marked = createState().update({
        effects: setHighlight.of(rangeOf("settings")),
      }).state;
      const { from, to } = rangeOf("settings");

      // Act
      const next = marked.update({ changes: { from, insert: "XY" } }).state;

      // Assert
      expect(next.field(highlightRangeField)).toEqual({
        from: from + 2,
        to: to + 2,
      });
    });

    it("should leave the text typed at its end out of the range", () => {
      // Arrange
      const marked = createState().update({
        effects: setHighlight.of(rangeOf("settings")),
      }).state;
      const { from, to } = rangeOf("settings");

      // Act
      const next = marked.update({ changes: { from: to, insert: "XY" } }).state;

      // Assert
      expect(next.field(highlightRangeField)).toEqual({ from, to });
    });

    it("should forget the range when the changes delete the text of the range", () => {
      // Arrange
      const marked = createState().update({
        effects: setHighlight.of(rangeOf("settings")),
      }).state;
      const { from, to } = rangeOf("settings");

      // Act
      const next = marked.update({ changes: { from, to } }).state;

      // Assert
      expect(next.field(highlightRangeField)).toBeUndefined();
    });

    it("should cover the text that replaces exactly the text of the range", () => {
      // Arrange
      const marked = createState().update({
        effects: setHighlight.of(rangeOf("settings")),
      }).state;
      const { from, to } = rangeOf("settings");

      // Act
      const next = marked.update({
        changes: { from, to, insert: "other" },
      }).state;

      // Assert
      expect(next.field(highlightRangeField)).toEqual({ from, to: from + 5 });
    });

    it("should forget the range when the changes replace the text around it", () => {
      // Arrange
      const marked = createState().update({
        effects: setHighlight.of(rangeOf("settings")),
      }).state;
      const { from, to } = rangeOf("settings");

      // Act
      const next = marked.update({
        changes: { from: from - 1, to: to + 1, insert: "other" },
      }).state;

      // Assert
      expect(next.field(highlightRangeField)).toBeUndefined();
    });

    it("should forget the range when the changes replace the whole text", () => {
      // Arrange
      const marked = createState().update({
        effects: setHighlight.of(rangeOf("settings")),
      }).state;

      // Act
      const next = marked.update({
        changes: { from: 0, to: TEXT.length, insert: `${TEXT}\n// more` },
      }).state;

      // Assert
      expect(next.field(highlightRangeField)).toBeUndefined();
    });

    it("should keep a range without width through the changes, as it has nothing to collapse", () => {
      // Arrange
      const { from } = rangeOf("rules");
      const marked = createState().update({
        effects: setHighlight.of({ from, to: from }),
      }).state;

      // Act
      const next = marked.update({
        changes: { from: 0, insert: "// config\n" },
      }).state;

      // Assert
      expect(next.field(highlightRangeField)).toEqual({
        from: from + 10,
        to: from + 10,
      });
    });

    it("should keep a range without width that text is typed at, after the text", () => {
      // Arrange
      const { from } = rangeOf("rules");
      const marked = createState().update({
        effects: setHighlight.of({ from, to: from }),
      }).state;

      // Act
      const next = marked.update({ changes: { from, insert: "XY" } }).state;

      // Assert
      expect(next.field(highlightRangeField)).toEqual({
        from: from + 2,
        to: from + 2,
      });
    });
  });

  describe("getHighlightRange", () => {
    it("should give null while nothing is highlighted", () => {
      // Arrange
      const state = createState();

      // Act
      const range = getHighlightRange(state);

      // Assert
      expect(range).toBeNull();
    });

    it("should give the range with the line and the column of its start", () => {
      // Arrange
      const marked = createState().update({
        effects: setHighlight.of(rangeOf("rules")),
      }).state;

      // Act
      const range = getHighlightRange(marked);

      // Assert
      expect(range).toEqual({ ...rangeOf("rules"), line: 3, column: 3 });
    });

    it("should give the line and the column of the start after the text moved it", () => {
      // Arrange
      const marked = createState().update({
        effects: setHighlight.of(rangeOf("rules")),
      }).state;
      const moved = marked.update({
        changes: { from: 0, insert: "// config\n// more\n" },
      }).state;

      // Act
      const range = getHighlightRange(moved);

      // Assert
      expect(range).toEqual({
        from: rangeOf("rules").from + 18,
        to: rangeOf("rules").to + 18,
        line: 5,
        column: 3,
      });
    });

    it("should give null after the changes delete the range", () => {
      // Arrange
      const marked = createState().update({
        effects: setHighlight.of(rangeOf("settings")),
      }).state;
      const { from, to } = rangeOf("settings");
      const deleted = marked.update({ changes: { from, to } }).state;

      // Act
      const range = getHighlightRange(deleted);

      // Assert
      expect(range).toBeNull();
    });
  });

  describe("highlightExtension", () => {
    it("should mark the gutter elements of the highlighted lines", () => {
      // Arrange
      const state = createState();

      // Act
      const next = state.update({
        effects: setHighlight.of({
          from: rangeOf("settings").from,
          to: rangeOf("rules").to,
        }),
      }).state;

      // Assert
      expect(getMarkedGutterLines(next)).toEqual([2, 3]);
    });

    it("should follow the lines when the text changes", () => {
      // Arrange
      const marked = createState().update({
        effects: setHighlight.of(rangeOf("settings")),
      }).state;

      // Act
      const next = marked.update({
        changes: { from: 0, insert: "// config\n" },
      }).state;

      // Assert
      expect(getMarkedGutterLines(next)).toEqual([3]);
    });

    it("should not mark the gutters without highlighted lines", () => {
      // Arrange
      const state = createState();

      // Act
      const lines = getMarkedGutterLines(state);

      // Assert
      expect(lines).toEqual([]);
    });
  });
});
