// cspell:ignore patern dissallow -- deliberate typos, the mistakes of the config that the tests report
import { insertNewlineAndIndent, undo } from "@codemirror/commands";
import { forEachDiagnostic } from "@codemirror/lint";
import { EditorSelection } from "@codemirror/state";
import type { EditorState } from "@codemirror/state";
import { EditorView, runScopeHandlers } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { render, screen as view } from "@testing-library/react";
import { StrictMode } from "react";
import type { RefObject } from "react";

import type { ConfigEditorSnapshot } from "@/domains/config/ui/contexts/ConfigEditorSnapshotContext";
import type {
  ConfigProblem,
  TextRange,
} from "@/domains/evaluation/helpers/engine";

import { ConfigEditor } from "./ConfigEditor";
import type { ConfigEditorProps } from "./ConfigEditor.types";
import { highlightStyle } from "./EditorTheme";
import { highlightField } from "./Highlight";

const TEXT = [
  "{",
  "  settings: {",
  '    "boundaries/elements": [{ type: "helper", patern: "x" }],',
  "  },",
  "  rules: {",
  '    "boundaries/dependencies": [2, { default: "dissallow" }],',
  "  },",
  "}",
].join("\n");

const LABEL = "Config eslint.config.js";

/**
 * Finds a snippet of the config text.
 * @param snippet The text to look for, once in the config.
 * @returns Its range, as the engine places a problem.
 */
function rangeOf(snippet: string): TextRange {
  const from = TEXT.indexOf(snippet);
  const before = TEXT.slice(0, from).split("\n");
  return {
    from,
    to: from + snippet.length,
    line: before.length,
    column: before[before.length - 1].length + 1,
  };
}

const WARNING: ConfigProblem = {
  level: "warning",
  title: "Some element descriptors are invalid and will be ignored.",
  detail: "Invalid descriptors: [].",
  links: ["https://www.jsboundaries.dev/docs/settings/"],
  path: ["settings", "boundaries/elements", 0],
  range: rangeOf('{ type: "helper", patern: "x" }'),
  source: "config",
};

const ERROR: ConfigProblem = {
  level: "error",
  title: "[boundaries/dependencies] Invalid rule options.",
  detail: 'Value "dissallow" should be equal to one of the allowed values.',
  links: [],
  path: ["rules", "boundaries/dependencies", 1, "default"],
  range: rangeOf('"dissallow"'),
  source: "config",
};

/**
 * Creates the props of the editor.
 * @param overrides What differs from a config without problems.
 * @returns The props.
 */
function createProps(
  overrides: Partial<ConfigEditorProps> = {}
): ConfigEditorProps {
  return {
    value: TEXT,
    onChange: jest.fn(),
    problems: [],
    label: LABEL,
    ...overrides,
  };
}

/**
 * Creates the place where the editor leaves its snapshot, as ConfigEditorSnapshotProvider does.
 * @returns A ref with no snapshot yet.
 */
function createSnapshot(): RefObject<ConfigEditorSnapshot | undefined> {
  return { current: undefined };
}

/**
 * Reads the scroll that a view still has to apply. jsdom has no layout, so the target that the view keeps until its next measure is the only trace of a scroll restored from a snapshot.
 * @param editor The view.
 * @returns The target, or `null` when there is none.
 */
function getPendingScroll(editor: EditorView): unknown {
  return (editor as unknown as { viewState: { scrollTarget: unknown } })
    .viewState.scrollTarget;
}

/**
 * Finds the CodeMirror view that an element of the document holds.
 * @param container The element the editor was rendered in.
 * @returns The view.
 */
function getEditorView(container: HTMLElement): EditorView {
  const editor = container.querySelector(".cm-editor") as HTMLElement;
  const found = EditorView.findFromDOM(editor);

  expect(found).not.toBeNull();

  return found as EditorView;
}

/**
 * Reads the diagnostics of a state.
 * @param state The state of the editor.
 * @returns Where each one is and how it looks.
 */
function getDiagnostics(
  state: EditorState
): { from: number; to: number; severity: string; message: string }[] {
  const diagnostics: {
    from: number;
    to: number;
    severity: string;
    message: string;
  }[] = [];
  forEachDiagnostic(state, ({ severity, message }, from, to) => {
    diagnostics.push({ from, to, severity, message });
  });
  return diagnostics;
}

/**
 * Reads the numbers of the lines that the highlight marks.
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

describe("ConfigEditor", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe("content", () => {
    it("should show the text in an editor that has the label as its name", () => {
      // Arrange
      const props = createProps();

      // Act
      render(<ConfigEditor {...props} />);

      // Assert
      const lines = Array.from(
        view.getByRole("textbox", { name: LABEL }).querySelectorAll(".cm-line")
      );

      expect(lines.map((line) => line.textContent).join("\n")).toBe(TEXT);
    });

    it("should show the line numbers", () => {
      // Arrange
      const props = createProps();

      // Act
      const { container } = render(<ConfigEditor {...props} />);

      // Assert
      const numbers = Array.from(
        container.querySelectorAll(".cm-lineNumbers .cm-gutterElement")
      ).map((element) => element.textContent);

      expect(numbers).toContain("1");
      expect(numbers).toContain("8");
    });

    it("should give the strings the class of the string tag", () => {
      // Arrange
      const props = createProps();
      const stringClass = highlightStyle.style([tags.string]) as string;

      // Act
      const { container } = render(<ConfigEditor {...props} />);

      // Assert
      const strings = Array.from(
        container.querySelectorAll(`.${stringClass}`)
      ).map((element) => element.textContent);

      expect(strings).toContain('"helper"');
      expect(strings).toContain('"dissallow"');
      expect(strings).not.toContain("settings");
    });

    it("should give the keys the class of the property name tag, and not the one of the strings", () => {
      // Arrange
      const props = createProps();
      const keyClass = highlightStyle.style([tags.propertyName]) as string;

      // Act
      const { container } = render(<ConfigEditor {...props} />);

      // Assert
      const keys = Array.from(container.querySelectorAll(`.${keyClass}`)).map(
        (element) => element.textContent
      );

      expect(keys).toContain("settings");
      expect(keys).toContain("type");
      expect(keys).toContain('"boundaries/dependencies"');
      expect(keys).not.toContain('"helper"');
    });

    it("should read the config as JSON5, with comments, unquoted keys and single quotes, and no error", () => {
      // Arrange
      const props = createProps({
        value: "{ // the settings\n  settings: { a: 'b', },\n}",
      });

      // Act
      const { container } = render(<ConfigEditor {...props} />);

      // Assert
      expect(container.querySelector(".cm-content")?.textContent).toBe(
        "{ // the settings  settings: { a: 'b', },}"
      );
      expect(container.querySelector(".cm-lintRange")).toBeNull();
    });

    it("should fill its container", () => {
      // Arrange
      const props = createProps();

      // Act
      const { container } = render(<ConfigEditor {...props} />);

      // Assert
      expect((container.firstElementChild as HTMLElement).style.height).toBe(
        "100%"
      );
    });

    it("should leave Tab to the browser, so that the focus can leave the editor", () => {
      // Arrange
      const { container } = render(<ConfigEditor {...createProps()} />);
      const editor = getEditorView(container);

      // Act
      const handled = runScopeHandlers(
        editor,
        new KeyboardEvent("keydown", { key: "Tab" }),
        "editor"
      );

      // Assert
      expect(handled).toBe(false);
    });
  });

  describe("edits", () => {
    it("should call onChange with the whole text after an edit of the user", () => {
      // Arrange
      const props = createProps();
      const { container } = render(<ConfigEditor {...props} />);
      const editor = getEditorView(container);

      // Act
      editor.dispatch({
        changes: { from: TEXT.length, insert: "\n// done" },
        userEvent: "input.type",
      });

      // Assert
      expect(props.onChange).toHaveBeenCalledTimes(1);
      expect(props.onChange).toHaveBeenCalledWith(`${TEXT}\n// done`);
    });

    it("should not call onChange when the selection moves", () => {
      // Arrange
      const props = createProps();
      const { container } = render(<ConfigEditor {...props} />);
      const editor = getEditorView(container);

      // Act
      editor.dispatch({ selection: { anchor: 4 } });

      // Assert
      expect(props.onChange).not.toHaveBeenCalled();
    });

    it("should call the latest onChange after the props change", () => {
      // Arrange
      const first = jest.fn();
      const second = jest.fn();
      const { container, rerender } = render(
        <ConfigEditor {...createProps({ onChange: first })} />
      );
      const editor = getEditorView(container);

      // Act
      rerender(<ConfigEditor {...createProps({ onChange: second })} />);
      editor.dispatch({
        changes: { from: 0, insert: " " },
        userEvent: "input.type",
      });

      // Assert
      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledWith(` ${TEXT}`);
    });

    it("should undo the edits of the user", () => {
      // Arrange
      const { container } = render(<ConfigEditor {...createProps()} />);
      const editor = getEditorView(container);
      editor.dispatch({
        changes: { from: 0, insert: " " },
        userEvent: "input.type",
      });

      // Act
      const undone = undo(editor);

      // Assert
      expect(undone).toBe(true);
      expect(editor.state.doc.toString()).toBe(TEXT);
    });
  });

  describe("value", () => {
    it("should replace the document with a new value, without reporting it as an edit", () => {
      // Arrange
      const props = createProps();
      const { container, rerender } = render(<ConfigEditor {...props} />);
      const editor = getEditorView(container);

      // Act
      rerender(<ConfigEditor {...props} value="{ settings: {} }" />);

      // Assert
      expect(editor.state.doc.toString()).toBe("{ settings: {} }");
      expect(props.onChange).not.toHaveBeenCalled();
    });

    it("should leave the document alone when the value is the text it has", () => {
      // Arrange
      const props = createProps();
      const { container, rerender } = render(<ConfigEditor {...props} />);
      const editor = getEditorView(container);
      const documentBefore = editor.state.doc;

      // Act
      rerender(<ConfigEditor {...props} />);

      // Assert
      expect(editor.state.doc).toBe(documentBefore);
    });

    it("should leave the document alone when the parent gives back the text that the user typed", () => {
      // Arrange
      const props = createProps();
      const { container, rerender } = render(<ConfigEditor {...props} />);
      const editor = getEditorView(container);
      editor.dispatch({
        changes: { from: 0, insert: " " },
        userEvent: "input.type",
      });
      const documentBefore = editor.state.doc;

      // Act
      rerender(<ConfigEditor {...props} value={` ${TEXT}`} />);

      // Assert
      expect(editor.state.doc).toBe(documentBefore);
    });

    it("should not put the replacement in the history, so that undo does not bring the old text back", () => {
      // Arrange
      const props = createProps();
      const { container, rerender } = render(<ConfigEditor {...props} />);
      const editor = getEditorView(container);

      // Act
      rerender(<ConfigEditor {...props} value="{}" />);
      const undone = undo(editor);

      // Assert
      expect(undone).toBe(false);
      expect(editor.state.doc.toString()).toBe("{}");
    });

    it("should replace the document without asking to scroll", () => {
      // Arrange
      const props = createProps();
      const { container, rerender } = render(<ConfigEditor {...props} />);
      const editor = getEditorView(container);
      const dispatch = jest.spyOn(editor, "dispatch");

      // Act
      rerender(<ConfigEditor {...props} value="{}" />);

      // Assert
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch.mock.calls[0][0]).not.toHaveProperty("scrollIntoView");
      expect(dispatch.mock.calls[0][0]).not.toHaveProperty("effects");
    });
  });

  describe("problems", () => {
    it("should mark the problems at their ranges, with the level and the message", () => {
      // Arrange
      const props = createProps({ problems: [WARNING, ERROR] });

      // Act
      const { container } = render(<ConfigEditor {...props} />);

      // Assert
      expect(getDiagnostics(getEditorView(container).state)).toEqual([
        {
          from: WARNING.range.from,
          to: WARNING.range.to,
          severity: "warning",
          message: `${WARNING.title}\n${WARNING.detail}\n${WARNING.links[0]}`,
        },
        {
          from: ERROR.range.from,
          to: ERROR.range.to,
          severity: "error",
          message: `${ERROR.title}\n${ERROR.detail}`,
        },
      ]);
    });

    it("should underline the text of each problem", () => {
      // Arrange
      const props = createProps({ problems: [WARNING, ERROR] });

      // Act
      const { container } = render(<ConfigEditor {...props} />);

      // Assert
      expect(container.querySelector(".cm-lintRange-error")?.textContent).toBe(
        '"dissallow"'
      );
      expect(
        container.querySelector(".cm-lintRange-warning")?.textContent
      ).toBe('{ type: "helper", patern: "x" }');
    });

    it("should mark the lines of the problems in the gutter", () => {
      // Arrange
      const props = createProps({ problems: [WARNING, ERROR] });

      // Act
      const { container } = render(<ConfigEditor {...props} />);

      // Assert
      expect(
        container.querySelectorAll(".cm-gutter-lint .cm-lint-marker-warning")
      ).toHaveLength(1);
      expect(
        container.querySelectorAll(".cm-gutter-lint .cm-lint-marker-error")
      ).toHaveLength(1);
    });

    it("should replace the problems when the list changes", () => {
      // Arrange
      const props = createProps({ problems: [WARNING, ERROR] });
      const { container, rerender } = render(<ConfigEditor {...props} />);

      // Act
      rerender(<ConfigEditor {...props} problems={[ERROR]} />);

      // Assert
      expect(getDiagnostics(getEditorView(container).state)).toHaveLength(1);
      expect(container.querySelector(".cm-lintRange-warning")).toBeNull();
    });

    it("should clear the problems when the list is empty", () => {
      // Arrange
      const props = createProps({ problems: [WARNING, ERROR] });
      const { container, rerender } = render(<ConfigEditor {...props} />);

      // Act
      rerender(<ConfigEditor {...props} problems={[]} />);

      // Assert
      expect(getDiagnostics(getEditorView(container).state)).toEqual([]);
      expect(container.querySelector(".cm-lint-marker-error")).toBeNull();
    });

    it("should keep the problems inside a document that is shorter than the text that was evaluated", () => {
      // Arrange
      const props = createProps({ value: "{}", problems: [ERROR] });

      // Act
      const { container } = render(<ConfigEditor {...props} />);

      // Assert
      expect(getDiagnostics(getEditorView(container).state)).toEqual([
        {
          from: 2,
          to: 2,
          severity: "error",
          message: `${ERROR.title}\n${ERROR.detail}`,
        },
      ]);
    });

    it("should show a problem without width, such as a parse error, as a point", () => {
      // Arrange
      const position = rangeOf("rules");
      const parseError: ConfigProblem = {
        level: "error",
        title: "The config must be one JSON5 object.",
        detail: "Unexpected token.",
        links: [],
        path: [],
        range: { ...position, to: position.from },
        source: "parse",
      };

      // Act
      const { container } = render(
        <ConfigEditor {...createProps({ problems: [parseError] })} />
      );

      // Assert
      expect(container.querySelector(".cm-lintPoint-error")).not.toBeNull();
    });
  });

  describe("highlight", () => {
    it("should mark the lines of the range", () => {
      // Arrange
      const props = createProps({
        highlight: rangeOf('"boundaries/dependencies"'),
      });

      // Act
      const { container } = render(<ConfigEditor {...props} />);

      // Assert
      expect(getHighlightedLines(getEditorView(container).state)).toEqual([6]);
      expect(
        container.querySelector(".cm-line.cm-jsb-highlight")?.textContent
      ).toContain("boundaries/dependencies");
    });

    it("should mark every line of a range that has several", () => {
      // Arrange
      const rules = TEXT.indexOf("  rules");
      const props = createProps({
        highlight: { from: rules, to: TEXT.length, line: 5, column: 1 },
      });

      // Act
      const { container } = render(<ConfigEditor {...props} />);

      // Assert
      expect(getHighlightedLines(getEditorView(container).state)).toEqual([
        5, 6, 7, 8,
      ]);
    });

    it("should mark the gutter of the lines of the range", () => {
      // Arrange
      const props = createProps({
        highlight: rangeOf('"boundaries/dependencies"'),
      });

      // Act
      const { container } = render(<ConfigEditor {...props} />);

      // Assert
      expect(
        container.querySelectorAll(
          ".cm-gutter-lint .cm-gutterElement.cm-jsb-highlight"
        )
      ).toHaveLength(1);
      expect(
        container.querySelectorAll(
          ".cm-lineNumbers .cm-gutterElement.cm-jsb-highlight"
        )
      ).toHaveLength(1);
    });

    it("should add the lines when the highlight is set, and remove them when it is unset", () => {
      // Arrange
      const props = createProps();
      const { container, rerender } = render(<ConfigEditor {...props} />);
      const editor = getEditorView(container);

      // Act
      rerender(<ConfigEditor {...props} highlight={rangeOf("settings")} />);
      const whileSet = getHighlightedLines(editor.state);
      rerender(<ConfigEditor {...props} highlight={undefined} />);

      // Assert
      expect(whileSet).toEqual([2]);
      expect(getHighlightedLines(editor.state)).toEqual([]);
      expect(container.querySelector(".cm-jsb-highlight")).toBeNull();
    });

    it("should move the lines when the offsets of the range change", () => {
      // Arrange
      const props = createProps({ highlight: rangeOf("settings") });
      const { container, rerender } = render(<ConfigEditor {...props} />);

      // Act
      rerender(<ConfigEditor {...props} highlight={rangeOf("rules")} />);

      // Assert
      expect(getHighlightedLines(getEditorView(container).state)).toEqual([5]);
    });

    it("should keep the lines where the edits of the user moved them when the parent builds the same range again", () => {
      // Arrange
      const props = createProps({ highlight: rangeOf("settings") });
      const { container, rerender } = render(<ConfigEditor {...props} />);
      const editor = getEditorView(container);
      editor.dispatch({
        changes: { from: 0, insert: "// config\n" },
        userEvent: "input.type",
      });

      // Act
      rerender(
        <ConfigEditor {...props} highlight={{ ...rangeOf("settings") }} />
      );

      // Assert
      expect(getHighlightedLines(editor.state)).toEqual([3]);
    });

    it("should drop the lines when the text is replaced from outside, as the offsets no longer point at the same lines", () => {
      // Arrange
      const props = createProps({ highlight: rangeOf("settings") });
      const { container, rerender } = render(<ConfigEditor {...props} />);

      // Act
      rerender(<ConfigEditor {...props} value={`${TEXT}\n// more`} />);

      // Assert
      expect(getHighlightedLines(getEditorView(container).state)).toEqual([]);
    });
  });

  describe("reveal", () => {
    it("should put the cursor at the start of the range, and scroll to the range", () => {
      // Arrange
      const range = rangeOf('"boundaries/dependencies"');
      const scrollIntoView = jest.spyOn(EditorView, "scrollIntoView");
      const props = createProps({ reveal: { range, key: 1 } });

      // Act
      const { container } = render(<ConfigEditor {...props} />);

      // Assert
      expect(getEditorView(container).state.selection.main.head).toBe(
        range.from
      );
      expect(scrollIntoView).toHaveBeenCalledWith(
        EditorSelection.range(range.from, range.to),
        {
          y: "start",
          yMargin: 120,
        }
      );
    });

    it("should reveal again when the key changes", () => {
      // Arrange
      const props = createProps({
        reveal: { range: rangeOf("settings"), key: 1 },
      });
      const { container, rerender } = render(<ConfigEditor {...props} />);
      const editor = getEditorView(container);
      const next = rangeOf("rules");

      // Act
      rerender(<ConfigEditor {...props} reveal={{ range: next, key: 2 }} />);

      // Assert
      expect(editor.state.selection.main.head).toBe(next.from);
    });

    it("should reveal a range at the start of the first request, whose key is 0", () => {
      // Arrange
      const range = rangeOf("rules");

      // Act
      const { container } = render(
        <ConfigEditor {...createProps({ reveal: { range, key: 0 } })} />
      );

      // Assert
      expect(getEditorView(container).state.selection.main.head).toBe(
        range.from
      );
    });

    it("should not move the cursor of the user when the same request comes again with another range", () => {
      // Arrange
      const props = createProps({
        reveal: { range: rangeOf("settings"), key: 1 },
      });
      const { container, rerender } = render(<ConfigEditor {...props} />);
      const editor = getEditorView(container);
      editor.dispatch({ selection: { anchor: 3 } });

      // Act
      rerender(
        <ConfigEditor {...props} reveal={{ range: rangeOf("rules"), key: 1 }} />
      );

      // Assert
      expect(editor.state.selection.main.head).toBe(3);
    });

    it("should do nothing without a request", () => {
      // Arrange
      const scrollIntoView = jest.spyOn(EditorView, "scrollIntoView");

      // Act
      const { container } = render(<ConfigEditor {...createProps()} />);

      // Assert
      expect(getEditorView(container).state.selection.main.head).toBe(0);
      expect(scrollIntoView).not.toHaveBeenCalled();
    });

    it("should keep a range that is past the end of the document inside it", () => {
      // Arrange
      const range = { from: 500, to: 600, line: 30, column: 1 };

      // Act
      const { container } = render(
        <ConfigEditor
          {...createProps({ value: "{}", reveal: { range, key: 1 } })}
        />
      );

      // Assert
      expect(getEditorView(container).state.selection.main.head).toBe(2);
    });

    it("should reveal the range in the view of a double mount, as the development mode of React does", () => {
      // Arrange
      const range = rangeOf("rules");

      // Act
      const { container } = render(
        <StrictMode>
          <ConfigEditor {...createProps({ reveal: { range, key: 1 } })} />
        </StrictMode>
      );

      // Assert
      expect(container.querySelectorAll(".cm-editor")).toHaveLength(1);
      expect(getEditorView(container).state.selection.main.head).toBe(
        range.from
      );
    });
  });

  describe("readOnly", () => {
    it("should allow edits by default", () => {
      // Arrange
      const { container } = render(<ConfigEditor {...createProps()} />);
      const editor = getEditorView(container);

      // Act
      const inserted = insertNewlineAndIndent(editor);

      // Assert
      expect(inserted).toBe(true);
      expect(editor.state.readOnly).toBe(false);
    });

    it("should refuse edits when it is set", () => {
      // Arrange
      const { container } = render(
        <ConfigEditor {...createProps({ readOnly: true })} />
      );
      const editor = getEditorView(container);

      // Act
      const inserted = insertNewlineAndIndent(editor);

      // Assert
      expect(inserted).toBe(false);
      expect(editor.state.readOnly).toBe(true);
      expect(editor.state.doc.toString()).toBe(TEXT);
    });

    it("should accept edits again when it is unset", () => {
      // Arrange
      const props = createProps({ readOnly: true });
      const { container, rerender } = render(<ConfigEditor {...props} />);
      const editor = getEditorView(container);

      // Act
      rerender(<ConfigEditor {...props} readOnly={false} />);

      // Assert
      expect(editor.state.readOnly).toBe(false);
    });
  });

  describe("label", () => {
    it("should follow the label", () => {
      // Arrange
      const props = createProps();
      const { rerender } = render(<ConfigEditor {...props} />);

      // Act
      rerender(<ConfigEditor {...props} label="Config of the example" />);

      // Assert
      expect(
        view.getByRole("textbox", { name: "Config of the example" })
      ).toBeTruthy();
    });
  });

  describe("snapshot", () => {
    it("should start from the value and leave nothing in the snapshot while it is mounted", () => {
      // Arrange
      const snapshot = createSnapshot();

      // Act
      const { container } = render(
        <ConfigEditor {...createProps({ snapshot })} />
      );

      // Assert
      expect(getEditorView(container).state.doc.toString()).toBe(TEXT);
      expect(snapshot.current).toBeUndefined();
    });

    it("should leave its state in the snapshot when it unmounts", () => {
      // Arrange
      const snapshot = createSnapshot();
      const { container, unmount } = render(
        <ConfigEditor {...createProps({ snapshot })} />
      );
      getEditorView(container).dispatch({
        changes: { from: 0, insert: " " },
        userEvent: "input.type",
      });

      // Act
      unmount();

      // Assert
      expect(snapshot.current?.state.doc.toString()).toBe(` ${TEXT}`);
    });

    it("should leave its scroll in the snapshot when it unmounts", () => {
      // Arrange
      const snapshot = createSnapshot();
      const scrollSnapshot = jest.spyOn(EditorView.prototype, "scrollSnapshot");
      const { unmount } = render(
        <ConfigEditor {...createProps({ snapshot })} />
      );

      // Act
      unmount();

      // Assert
      expect(scrollSnapshot).toHaveBeenCalledTimes(1);
      expect(snapshot.current?.scroll).toBe(
        scrollSnapshot.mock.results[0].value
      );
    });

    it("should replace the snapshot each time it unmounts", () => {
      // Arrange
      const snapshot = createSnapshot();
      const first = render(<ConfigEditor {...createProps({ snapshot })} />);
      first.unmount();
      const stateOfFirst = snapshot.current?.state;
      const second = render(<ConfigEditor {...createProps({ snapshot })} />);
      getEditorView(second.container).dispatch({
        changes: { from: 0, insert: " " },
        userEvent: "input.type",
      });

      // Act
      second.unmount();

      // Assert
      expect(snapshot.current?.state).not.toBe(stateOfFirst);
      expect(snapshot.current?.state.doc.toString()).toBe(` ${TEXT}`);
    });

    it("should start from the state of the snapshot when it mounts again", () => {
      // Arrange
      const snapshot = createSnapshot();
      const first = render(<ConfigEditor {...createProps({ snapshot })} />);
      getEditorView(first.container).dispatch({
        changes: { from: 0, insert: " " },
        userEvent: "input.type",
      });
      first.unmount();

      // Act
      const { container } = render(
        <ConfigEditor {...createProps({ snapshot, value: ` ${TEXT}` })} />
      );

      // Assert
      expect(getEditorView(container).state.doc).toBe(
        snapshot.current?.state.doc
      );
      expect(getEditorView(container).state.doc.toString()).toBe(` ${TEXT}`);
    });

    it("should keep the undo history when it mounts again", () => {
      // Arrange
      const snapshot = createSnapshot();
      const first = render(<ConfigEditor {...createProps({ snapshot })} />);
      getEditorView(first.container).dispatch({
        changes: { from: 0, insert: " " },
        userEvent: "input.type",
      });
      first.unmount();
      const { container } = render(
        <ConfigEditor {...createProps({ snapshot, value: ` ${TEXT}` })} />
      );
      const editor = getEditorView(container);

      // Act
      const undone = undo(editor);

      // Assert
      expect(undone).toBe(true);
      expect(editor.state.doc.toString()).toBe(TEXT);
    });

    it("should start with an empty history when there is no snapshot", () => {
      // Arrange
      const first = render(<ConfigEditor {...createProps()} />);
      getEditorView(first.container).dispatch({
        changes: { from: 0, insert: " " },
        userEvent: "input.type",
      });
      first.unmount();
      const { container } = render(
        <ConfigEditor {...createProps({ value: ` ${TEXT}` })} />
      );

      // Act
      const undone = undo(getEditorView(container));

      // Assert
      expect(undone).toBe(false);
    });

    it("should keep the selection when it mounts again", () => {
      // Arrange
      const snapshot = createSnapshot();
      const first = render(<ConfigEditor {...createProps({ snapshot })} />);
      getEditorView(first.container).dispatch({
        selection: EditorSelection.range(4, 9),
      });
      first.unmount();

      // Act
      const { container } = render(
        <ConfigEditor {...createProps({ snapshot })} />
      );

      // Assert
      const { anchor, head } = getEditorView(container).state.selection.main;

      expect([anchor, head]).toEqual([4, 9]);
    });

    it("should scroll to where it was left when it mounts again", () => {
      // Arrange
      const snapshot = createSnapshot();
      const first = render(<ConfigEditor {...createProps({ snapshot })} />);
      getEditorView(first.container).dispatch({
        effects: EditorView.scrollIntoView(120, { y: "start" }),
      });
      first.unmount();
      const scrollLeft = snapshot.current?.scroll;

      // Act
      const { container } = render(
        <ConfigEditor {...createProps({ snapshot })} />
      );

      // Assert
      expect(scrollLeft).toBeDefined();
      expect(getPendingScroll(getEditorView(container))).not.toBeNull();
    });

    it("should have no scroll to apply when it starts without a snapshot", () => {
      // Act
      const { container } = render(<ConfigEditor {...createProps()} />);

      // Assert
      expect(getPendingScroll(getEditorView(container))).toBeNull();
    });

    it("should call the onChange of the component that mounts it again", () => {
      // Arrange
      const snapshot = createSnapshot();
      const onChangeOfFirst = jest.fn();
      const onChangeOfSecond = jest.fn();
      const first = render(
        <ConfigEditor
          {...createProps({ snapshot, onChange: onChangeOfFirst })}
        />
      );
      first.unmount();
      const { container } = render(
        <ConfigEditor
          {...createProps({ snapshot, onChange: onChangeOfSecond })}
        />
      );

      // Act
      getEditorView(container).dispatch({
        changes: { from: 0, insert: " " },
        userEvent: "input.type",
      });

      // Assert
      expect(onChangeOfFirst).not.toHaveBeenCalled();
      expect(onChangeOfSecond).toHaveBeenCalledTimes(1);
      expect(onChangeOfSecond).toHaveBeenCalledWith(` ${TEXT}`);
    });

    it("should report an edit once after a double mount, as the development mode of React does", () => {
      // Arrange
      const snapshot = createSnapshot();
      const props = createProps({ snapshot });
      const { container } = render(
        <StrictMode>
          <ConfigEditor {...props} />
        </StrictMode>
      );

      // Act
      getEditorView(container).dispatch({
        changes: { from: 0, insert: " " },
        userEvent: "input.type",
      });

      // Assert
      expect(container.querySelectorAll(".cm-editor")).toHaveLength(1);
      expect(props.onChange).toHaveBeenCalledTimes(1);
    });

    it("should start from the value when the document of the snapshot differs from it", () => {
      // Arrange
      const snapshot = createSnapshot();
      const first = render(<ConfigEditor {...createProps({ snapshot })} />);
      first.unmount();
      const props = createProps({ snapshot, value: "{}" });

      // Act
      const { container } = render(<ConfigEditor {...props} />);

      // Assert
      expect(getEditorView(container).state.doc.toString()).toBe("{}");
      expect(props.onChange).not.toHaveBeenCalled();
    });

    it("should mark the problems it is given, and not the ones the snapshot kept", () => {
      // Arrange
      const snapshot = createSnapshot();
      const first = render(
        <ConfigEditor
          {...createProps({ snapshot, problems: [WARNING, ERROR] })}
        />
      );
      first.unmount();

      // Act
      const { container } = render(
        <ConfigEditor {...createProps({ snapshot, problems: [ERROR] })} />
      );

      // Assert
      expect(getDiagnostics(getEditorView(container).state)).toHaveLength(1);
      expect(container.querySelector(".cm-lintRange-warning")).toBeNull();
    });

    it("should honor read only after it mounts again", () => {
      // Arrange
      const snapshot = createSnapshot();
      const first = render(<ConfigEditor {...createProps({ snapshot })} />);
      first.unmount();
      const props = createProps({ snapshot, readOnly: true });
      const { container } = render(<ConfigEditor {...props} />);
      const editor = getEditorView(container);

      // Act
      insertNewlineAndIndent(editor);

      // Assert
      expect(editor.state.doc.toString()).toBe(TEXT);
    });
  });

  describe("lifecycle", () => {
    it("should create the view once, however many times it renders", () => {
      // Arrange
      const props = createProps();
      const { container, rerender } = render(<ConfigEditor {...props} />);
      const editor = getEditorView(container);

      // Act
      rerender(<ConfigEditor {...props} problems={[ERROR]} />);
      rerender(<ConfigEditor {...props} value="{}" />);

      // Assert
      expect(container.querySelectorAll(".cm-editor")).toHaveLength(1);
      expect(getEditorView(container)).toBe(editor);
    });

    it("should destroy the view on unmount", () => {
      // Arrange
      const destroy = jest.spyOn(EditorView.prototype, "destroy");
      const { container, unmount } = render(
        <ConfigEditor {...createProps()} />
      );

      // Act
      unmount();

      // Assert
      expect(destroy).toHaveBeenCalledTimes(1);
      expect(container.querySelector(".cm-editor")).toBeNull();
    });
  });
});
