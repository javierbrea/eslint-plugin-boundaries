import { EditorState } from "@codemirror/state";
import { gutterLineClass } from "@codemirror/view";

import {
  highlightExtension,
  highlightField,
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
