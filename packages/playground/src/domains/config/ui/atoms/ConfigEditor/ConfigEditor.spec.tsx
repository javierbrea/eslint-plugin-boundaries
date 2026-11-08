// cspell:ignore patern dissallow -- deliberate typos, the mistakes of the config that the tests report
import { render } from "@testing-library/react";
import { StrictMode, useState } from "react";
import type { ReactNode, RefObject } from "react";

import type { ConfigEditorSnapshot } from "@/domains/config/ui/contexts/ConfigEditorSnapshotContext";
import type {
  ConfigProblem,
  TextRange,
} from "@/domains/evaluation/helpers/engine";

import { ConfigEditor } from "./ConfigEditor";
import { ConfigEditorPom } from "./ConfigEditor.pom";
import type { ConfigEditorProps } from "./ConfigEditor.types";

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
 * Mounts the editor under a parent that does what the store does: it keeps the text and the range that the editor reports with each edit, and gives them back as the `value` and the `highlight`.
 * @param props The props of the editor, whose `onChange` also receives what the editor reports.
 * @returns The editor.
 */
function EchoingEditor(props: Readonly<ConfigEditorProps>): ReactNode {
  const [value, setValue] = useState(props.value);
  const [highlight, setHighlight] = useState(props.highlight);

  return (
    <ConfigEditor
      {...props}
      value={value}
      highlight={highlight}
      onChange={(text, range) => {
        props.onChange(text, range);
        setValue(text);
        setHighlight(range ?? undefined);
      }}
    />
  );
}

describe("ConfigEditor", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe("content", () => {
    it("should show the text in an editor that has the label as its name", () => {
      // Arrange
      const props = createProps();
      render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom({ name: LABEL });

      // Act
      const { renderedText } = editor;

      // Assert
      expect(renderedText).toBe(TEXT);
    });

    it("should show the line numbers", () => {
      // Arrange
      const props = createProps();
      render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      const { lineNumbers } = editor;

      // Assert
      expect(lineNumbers).toContain("1");
      expect(lineNumbers).toContain("8");
    });

    it("should give the strings the class of the string tag", () => {
      // Arrange
      const props = createProps();
      render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      const { stringTokens } = editor;

      // Assert
      expect(stringTokens).toContain('"helper"');
      expect(stringTokens).toContain('"dissallow"');
      expect(stringTokens).not.toContain("settings");
    });

    it("should give the keys the class of the property name tag, and not the one of the strings", () => {
      // Arrange
      const props = createProps();
      render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      const { keyTokens } = editor;

      // Assert
      expect(keyTokens).toContain("settings");
      expect(keyTokens).toContain("type");
      expect(keyTokens).toContain('"boundaries/dependencies"');
      expect(keyTokens).not.toContain('"helper"');
    });

    it("should read the config as JSON5, with comments, unquoted keys and single quotes, and no error", () => {
      // Arrange
      const props = createProps({
        value: "{ // the settings\n  settings: { a: 'b', },\n}",
      });
      render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      const { renderedText, hasUnderline } = editor;

      // Assert
      expect(renderedText).toBe(
        "{ // the settings\n  settings: { a: 'b', },\n}"
      );
      expect(hasUnderline).toBe(false);
    });

    it("should fill its container", () => {
      // Arrange
      const props = createProps();
      render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      const { height } = editor;

      // Assert
      expect(height).toBe("100%");
    });

    it("should leave Tab to the browser, so that the focus can leave the editor", () => {
      // Arrange
      render(<ConfigEditor {...createProps()} />);
      const editor = new ConfigEditorPom();

      // Act
      const handled = editor.pressTab();

      // Assert
      expect(handled).toBe(false);
    });
  });

  describe("edits", () => {
    it("should call onChange with the whole text after an edit of the user", () => {
      // Arrange
      const props = createProps();
      render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      editor.typeAt(TEXT.length, "\n// done");

      // Assert
      expect(props.onChange).toHaveBeenCalledTimes(1);
      expect(props.onChange).toHaveBeenCalledWith(`${TEXT}\n// done`, null);
    });

    it("should call onChange with where the highlight is after the edit, moved by it", () => {
      // Arrange
      const policy = rangeOf('"boundaries/dependencies"');
      const props = createProps({ highlight: policy });
      render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      editor.typeAt(0, "// done\n");

      // Assert
      expect(props.onChange).toHaveBeenCalledTimes(1);
      expect(props.onChange).toHaveBeenCalledWith(`// done\n${TEXT}`, {
        from: policy.from + 8,
        to: policy.to + 8,
        line: policy.line + 1,
        column: policy.column,
      });
    });

    it("should call onChange with the column of the highlight after an edit on its line", () => {
      // Arrange
      const policy = rangeOf('"boundaries/dependencies"');
      const props = createProps({ highlight: policy });
      render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      editor.typeAt(policy.from - policy.column + 1, "  ");

      // Assert
      expect(props.onChange).toHaveBeenCalledWith(expect.any(String), {
        ...policy,
        from: policy.from + 2,
        to: policy.to + 2,
        column: policy.column + 2,
      });
    });

    it("should call onChange with the highlight as it was when the edit is after it", () => {
      // Arrange
      const policy = rangeOf("settings");
      const props = createProps({ highlight: policy });
      render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      editor.typeAt(TEXT.length, "\n// done");

      // Assert
      expect(props.onChange).toHaveBeenCalledWith(`${TEXT}\n// done`, policy);
    });

    it("should call onChange with no highlight when the edit deletes the text of the highlight", () => {
      // Arrange
      const policy = rangeOf('"boundaries/dependencies"');
      const props = createProps({ highlight: policy });
      render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      editor.replaceText(policy.from, policy.to, "");

      // Assert
      expect(props.onChange).toHaveBeenCalledWith(
        TEXT.slice(0, policy.from) + TEXT.slice(policy.to),
        null
      );
      expect(editor.highlightedLines).toEqual([]);
    });

    it("should call onChange with no highlight when none is set", () => {
      // Arrange
      const props = createProps();
      render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      editor.typeAt(0, " ");

      // Assert
      expect(props.onChange).toHaveBeenCalledWith(` ${TEXT}`, null);
    });

    it("should call onChange with the highlight that the snapshot kept, moved by the edit", () => {
      // Arrange
      const snapshot = createSnapshot();
      const policy = rangeOf("settings");
      const first = render(
        <ConfigEditor {...createProps({ snapshot, highlight: policy })} />
      );
      first.unmount();
      const props = createProps({ snapshot, highlight: policy });
      render(<ConfigEditor {...props} />);

      // Act
      new ConfigEditorPom().typeAt(0, " ");

      // Assert
      expect(props.onChange).toHaveBeenCalledWith(` ${TEXT}`, {
        ...policy,
        from: policy.from + 1,
        to: policy.to + 1,
      });
    });

    it("should not call onChange when the selection moves", () => {
      // Arrange
      const props = createProps();
      render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      editor.moveCursor(4);

      // Assert
      expect(props.onChange).not.toHaveBeenCalled();
    });

    it("should call the latest onChange after the props change", () => {
      // Arrange
      const first = jest.fn();
      const second = jest.fn();
      const { rerender } = render(
        <ConfigEditor {...createProps({ onChange: first })} />
      );
      const editor = new ConfigEditorPom();

      // Act
      rerender(<ConfigEditor {...createProps({ onChange: second })} />);
      editor.typeAt(0, " ");

      // Assert
      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledWith(` ${TEXT}`, null);
    });

    it("should undo the edits of the user", () => {
      // Arrange
      render(<ConfigEditor {...createProps()} />);
      const editor = new ConfigEditorPom();
      editor.typeAt(0, " ");

      // Act
      const undone = editor.undo();

      // Assert
      expect(undone).toBe(true);
      expect(editor.text).toBe(TEXT);
    });
  });

  describe("value", () => {
    it("should replace the document with a new value, without reporting it as an edit", () => {
      // Arrange
      const props = createProps();
      const { rerender } = render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      rerender(<ConfigEditor {...props} value="{ settings: {} }" />);

      // Assert
      expect(editor.text).toBe("{ settings: {} }");
      expect(props.onChange).not.toHaveBeenCalled();
    });

    it("should leave the document alone when the value is the text it has", () => {
      // Arrange
      const props = createProps();
      const { rerender } = render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();
      const documentBefore = editor.documentId;

      // Act
      rerender(<ConfigEditor {...props} />);

      // Assert
      expect(editor.documentId).toBe(documentBefore);
    });

    it("should leave the document alone when the parent gives back the text that the user typed", () => {
      // Arrange
      const props = createProps();
      const { rerender } = render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();
      editor.typeAt(0, " ");
      const documentBefore = editor.documentId;

      // Act
      rerender(<ConfigEditor {...props} value={` ${TEXT}`} />);

      // Assert
      expect(editor.documentId).toBe(documentBefore);
    });

    it("should not put the replacement in the history, so that undo does not bring the old text back", () => {
      // Arrange
      const props = createProps();
      const { rerender } = render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      rerender(<ConfigEditor {...props} value="{}" />);
      const undone = editor.undo();

      // Assert
      expect(undone).toBe(false);
      expect(editor.text).toBe("{}");
    });

    it("should replace the document without asking to scroll", () => {
      // Arrange
      const props = createProps();
      const { rerender } = render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();
      const dispatches = editor.recordDispatches();

      // Act
      rerender(<ConfigEditor {...props} value="{}" />);

      // Assert
      expect(dispatches.count).toBe(1);
      expect(dispatches.scrolled).toBe(false);
      expect(dispatches.hasEffects).toBe(false);
    });
  });

  describe("problems", () => {
    it("should mark the problems at their ranges, with the level and the message", () => {
      // Arrange
      const props = createProps({ problems: [WARNING, ERROR] });
      render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      const { diagnostics } = editor;

      // Assert
      expect(diagnostics).toEqual([
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
      render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      const errorText = editor.underlinedText("error");
      const warningText = editor.underlinedText("warning");

      // Assert
      expect(errorText).toBe('"dissallow"');
      expect(warningText).toBe('{ type: "helper", patern: "x" }');
    });

    it("should mark the lines of the problems in the gutter", () => {
      // Arrange
      const props = createProps({ problems: [WARNING, ERROR] });
      render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      const warnings = editor.gutterMarkerCount("warning");
      const errors = editor.gutterMarkerCount("error");

      // Assert
      expect(warnings).toBe(1);
      expect(errors).toBe(1);
    });

    it("should replace the problems when the list changes", () => {
      // Arrange
      const props = createProps({ problems: [WARNING, ERROR] });
      const { rerender } = render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      rerender(<ConfigEditor {...props} problems={[ERROR]} />);

      // Assert
      expect(editor.diagnostics).toHaveLength(1);
      expect(editor.underlinedText("warning")).toBeNull();
    });

    it("should clear the problems when the list is empty", () => {
      // Arrange
      const props = createProps({ problems: [WARNING, ERROR] });
      const { rerender } = render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      rerender(<ConfigEditor {...props} problems={[]} />);

      // Assert
      expect(editor.diagnostics).toEqual([]);
      expect(editor.gutterMarkerCount("error")).toBe(0);
    });

    it("should keep the problems inside a document that is shorter than the text that was evaluated", () => {
      // Arrange
      const props = createProps({ value: "{}", problems: [ERROR] });
      render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      const { diagnostics } = editor;

      // Assert
      expect(diagnostics).toEqual([
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
      render(<ConfigEditor {...createProps({ problems: [parseError] })} />);
      const editor = new ConfigEditorPom();

      // Act
      const hasPoint = editor.hasPoint("error");

      // Assert
      expect(hasPoint).toBe(true);
    });
  });

  describe("highlight", () => {
    it("should mark the lines of the range", () => {
      // Arrange
      const props = createProps({
        highlight: rangeOf('"boundaries/dependencies"'),
      });
      render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      const { highlightedLines, highlightedLineTexts } = editor;

      // Assert
      expect(highlightedLines).toEqual([6]);
      expect(highlightedLineTexts[0]).toContain("boundaries/dependencies");
    });

    it("should mark every line of a range that has several", () => {
      // Arrange
      const rules = TEXT.indexOf("  rules");
      const props = createProps({
        highlight: { from: rules, to: TEXT.length, line: 5, column: 1 },
      });
      render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      const { highlightedLines } = editor;

      // Assert
      expect(highlightedLines).toEqual([5, 6, 7, 8]);
    });

    it("should mark the gutter of the lines of the range", () => {
      // Arrange
      const props = createProps({
        highlight: rangeOf('"boundaries/dependencies"'),
      });
      render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      const { highlightedProblemGutterCount, highlightedLineNumberCount } =
        editor;

      // Assert
      expect(highlightedProblemGutterCount).toBe(1);
      expect(highlightedLineNumberCount).toBe(1);
    });

    it("should add the lines when the highlight is set, and remove them when it is unset", () => {
      // Arrange
      const props = createProps();
      const { rerender } = render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      rerender(<ConfigEditor {...props} highlight={rangeOf("settings")} />);
      const whileSet = editor.highlightedLines;
      rerender(<ConfigEditor {...props} highlight={undefined} />);

      // Assert
      expect(whileSet).toEqual([2]);
      expect(editor.highlightedLines).toEqual([]);
      expect(editor.highlightMarkCount).toBe(0);
    });

    it("should move the lines when the offsets of the range change", () => {
      // Arrange
      const props = createProps({ highlight: rangeOf("settings") });
      const { rerender } = render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      rerender(<ConfigEditor {...props} highlight={rangeOf("rules")} />);

      // Assert
      expect(editor.highlightedLines).toEqual([5]);
    });

    it("should mark the lines of the new range when only the end of the range changes", () => {
      // Arrange
      const settings = rangeOf("settings");
      const props = createProps({ highlight: settings });
      const { rerender } = render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      rerender(
        <ConfigEditor
          {...props}
          highlight={{ ...settings, to: TEXT.indexOf("  rules") - 1 }}
        />
      );

      // Assert
      expect(editor.highlightedLines).toEqual([2, 3, 4]);
    });

    it("should mark the lines of the new range when only the start of the range changes", () => {
      // Arrange
      const settings = rangeOf("settings");
      const to = TEXT.indexOf("  rules") - 1;
      const props = createProps({ highlight: { ...settings, to } });
      const { rerender } = render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      rerender(
        <ConfigEditor
          {...props}
          highlight={{ ...settings, from: TEXT.indexOf('    "boundaries'), to }}
        />
      );

      // Assert
      expect(editor.highlightedLines).toEqual([3, 4]);
    });

    it("should keep the lines where the edits of the user moved them when the parent builds the same range again", () => {
      // Arrange
      const props = createProps({ highlight: rangeOf("settings") });
      const { rerender } = render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();
      editor.typeAt(0, "// config\n");

      // Act
      rerender(
        <ConfigEditor {...props} highlight={{ ...rangeOf("settings") }} />
      );

      // Assert
      expect(editor.highlightedLines).toEqual([3]);
    });

    it("should mark the lines that the user adds inside the range", () => {
      // Arrange
      const rules = TEXT.indexOf("  rules");
      const props = createProps({
        highlight: { from: rules, to: TEXT.length - 2, line: 5, column: 1 },
      });
      render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      editor.typeAt(
        TEXT.lastIndexOf("  },"),
        "    other: 1,\n    another: 2,\n"
      );

      // Assert
      expect(editor.highlightedLines).toEqual([5, 6, 7, 8, 9]);
    });

    it("should not move the lines, nor dispatch to set them again, when the parent gives back the range that the editor reported", () => {
      // Arrange
      const props = createProps({ highlight: rangeOf("settings") });
      render(<EchoingEditor {...props} />);
      const editor = new ConfigEditorPom();
      const recording = editor.recordDispatches();

      // Act
      editor.typeAt(0, "// config\n");

      // Assert
      expect(editor.highlightedLines).toEqual([3]);
      expect(recording.count).toBe(1);
      expect(recording.hasEffects).toBe(false);
    });

    it("should keep following the edits of the user when the parent gives back the ranges that the editor reported", () => {
      // Arrange
      const props = createProps({ highlight: rangeOf("rules") });
      render(<EchoingEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      editor.typeAt(0, "// one\n");
      editor.typeAt(0, "// two\n");
      editor.typeAt(0, "// three\n");

      // Assert
      expect(editor.highlightedLines).toEqual([8]);
      expect(props.onChange).toHaveBeenLastCalledWith(
        `// three\n// two\n// one\n${TEXT}`,
        {
          ...rangeOf("rules"),
          from: rangeOf("rules").from + 23,
          to: rangeOf("rules").to + 23,
          line: 8,
        }
      );
    });

    it("should drop the lines when the parent gives back no range, as the editor reported when the text of the highlight was deleted", () => {
      // Arrange
      const policy = rangeOf("settings");
      const props = createProps({ highlight: policy });
      render(<EchoingEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      editor.replaceText(policy.from, policy.to, "");

      // Assert
      expect(editor.highlightedLines).toEqual([]);
      expect(editor.highlightMarkCount).toBe(0);
    });

    it("should drop the lines when the text is replaced from outside, as the offsets no longer point at the same lines", () => {
      // Arrange
      const props = createProps({ highlight: rangeOf("settings") });
      const { rerender } = render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      rerender(<ConfigEditor {...props} value={`${TEXT}\n// more`} />);

      // Assert
      expect(editor.highlightedLines).toEqual([]);
    });
  });

  describe("reveal", () => {
    it("should put the cursor at the start of the range, and scroll to the range", () => {
      // Arrange
      const range = rangeOf('"boundaries/dependencies"');
      const editor = new ConfigEditorPom();
      const reveals = ConfigEditorPom.recordReveals();
      const props = createProps({ reveal: { range, key: 1 } });

      // Act
      render(<ConfigEditor {...props} />);

      // Assert
      expect(editor.cursor).toBe(range.from);
      expect(reveals.requests).toContainEqual({
        from: range.from,
        to: range.to,
        anchor: range.from,
        head: range.to,
        y: "start",
        yMargin: 120,
      });
    });

    it("should reveal again when the key changes", () => {
      // Arrange
      const props = createProps({
        reveal: { range: rangeOf("settings"), key: 1 },
      });
      const { rerender } = render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();
      const next = rangeOf("rules");

      // Act
      rerender(<ConfigEditor {...props} reveal={{ range: next, key: 2 }} />);

      // Assert
      expect(editor.cursor).toBe(next.from);
    });

    it("should reveal a range at the start of the first request, whose key is 0", () => {
      // Arrange
      const range = rangeOf("rules");

      // Act
      render(<ConfigEditor {...createProps({ reveal: { range, key: 0 } })} />);

      // Assert
      expect(new ConfigEditorPom().cursor).toBe(range.from);
    });

    it("should not move the cursor of the user when the same request comes again with another range", () => {
      // Arrange
      const props = createProps({
        reveal: { range: rangeOf("settings"), key: 1 },
      });
      const { rerender } = render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();
      editor.moveCursor(3);

      // Act
      rerender(
        <ConfigEditor {...props} reveal={{ range: rangeOf("rules"), key: 1 }} />
      );

      // Assert
      expect(editor.cursor).toBe(3);
    });

    it("should do nothing without a request", () => {
      // Arrange
      const editor = new ConfigEditorPom();
      const reveals = ConfigEditorPom.recordReveals();

      // Act
      render(<ConfigEditor {...createProps()} />);

      // Assert
      expect(editor.cursor).toBe(0);
      expect(reveals.requests).toEqual([]);
    });

    it("should keep a range that is past the end of the document inside it", () => {
      // Arrange
      const range = { from: 500, to: 600, line: 30, column: 1 };

      // Act
      render(
        <ConfigEditor
          {...createProps({ value: "{}", reveal: { range, key: 1 } })}
        />
      );

      // Assert
      expect(new ConfigEditorPom().cursor).toBe(2);
    });

    it("should reveal the range in the view of a double mount, as the development mode of React does", () => {
      // Arrange
      const range = rangeOf("rules");

      // Act
      render(
        <StrictMode>
          <ConfigEditor {...createProps({ reveal: { range, key: 1 } })} />
        </StrictMode>
      );

      // Assert
      const editor = new ConfigEditorPom();

      expect(editor.editorCount).toBe(1);
      expect(editor.cursor).toBe(range.from);
    });
  });

  describe("readOnly", () => {
    it("should allow edits by default", () => {
      // Arrange
      render(<ConfigEditor {...createProps()} />);
      const editor = new ConfigEditorPom();

      // Act
      const inserted = editor.pressEnter();

      // Assert
      expect(inserted).toBe(true);
      expect(editor.isReadOnly).toBe(false);
    });

    it("should refuse edits when it is set", () => {
      // Arrange
      render(<ConfigEditor {...createProps({ readOnly: true })} />);
      const editor = new ConfigEditorPom();

      // Act
      const inserted = editor.pressEnter();

      // Assert
      expect(inserted).toBe(false);
      expect(editor.isReadOnly).toBe(true);
      expect(editor.text).toBe(TEXT);
    });

    it("should accept edits again when it is unset", () => {
      // Arrange
      const props = createProps({ readOnly: true });
      const { rerender } = render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();

      // Act
      rerender(<ConfigEditor {...props} readOnly={false} />);

      // Assert
      expect(editor.isReadOnly).toBe(false);
    });
  });

  describe("label", () => {
    it("should follow the label", () => {
      // Arrange
      const props = createProps();
      const { rerender } = render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom({ name: "Config of the example" });

      // Act
      rerender(<ConfigEditor {...props} label="Config of the example" />);

      // Assert
      expect(editor.isRendered).toBe(true);
    });
  });

  describe("snapshot", () => {
    it("should start from the value and leave nothing in the snapshot while it is mounted", () => {
      // Arrange
      const snapshot = createSnapshot();

      // Act
      render(<ConfigEditor {...createProps({ snapshot })} />);

      // Assert
      expect(new ConfigEditorPom().text).toBe(TEXT);
      expect(snapshot.current).toBeUndefined();
    });

    it("should leave its state in the snapshot when it unmounts", () => {
      // Arrange
      const snapshot = createSnapshot();
      const { unmount } = render(
        <ConfigEditor {...createProps({ snapshot })} />
      );
      new ConfigEditorPom().typeAt(0, " ");

      // Act
      unmount();

      // Assert
      expect(ConfigEditorPom.textOfSnapshot(snapshot.current)).toBe(` ${TEXT}`);
    });

    it("should leave its scroll in the snapshot when it unmounts", () => {
      // Arrange
      const snapshot = createSnapshot();
      const scrollSnapshots = ConfigEditorPom.recordScrollSnapshots();
      const { unmount } = render(
        <ConfigEditor {...createProps({ snapshot })} />
      );

      // Act
      unmount();

      // Assert
      expect(scrollSnapshots.count).toBe(1);
      expect(snapshot.current?.scroll).toBe(scrollSnapshots.values[0]);
    });

    it("should replace the snapshot each time it unmounts", () => {
      // Arrange
      const snapshot = createSnapshot();
      const editor = new ConfigEditorPom();
      const first = render(<ConfigEditor {...createProps({ snapshot })} />);
      first.unmount();
      const stateOfFirst = snapshot.current?.state;
      const second = render(<ConfigEditor {...createProps({ snapshot })} />);
      editor.typeAt(0, " ");

      // Act
      second.unmount();

      // Assert
      expect(snapshot.current?.state).not.toBe(stateOfFirst);
      expect(ConfigEditorPom.textOfSnapshot(snapshot.current)).toBe(` ${TEXT}`);
    });

    it("should start from the state of the snapshot when it mounts again", () => {
      // Arrange
      const snapshot = createSnapshot();
      const editor = new ConfigEditorPom();
      const first = render(<ConfigEditor {...createProps({ snapshot })} />);
      editor.typeAt(0, " ");
      first.unmount();

      // Act
      render(
        <ConfigEditor {...createProps({ snapshot, value: ` ${TEXT}` })} />
      );

      // Assert
      expect(editor.showsDocumentOf(snapshot.current)).toBe(true);
      expect(editor.text).toBe(` ${TEXT}`);
    });

    it("should keep the undo history when it mounts again", () => {
      // Arrange
      const snapshot = createSnapshot();
      const editor = new ConfigEditorPom();
      const first = render(<ConfigEditor {...createProps({ snapshot })} />);
      editor.typeAt(0, " ");
      first.unmount();
      render(
        <ConfigEditor {...createProps({ snapshot, value: ` ${TEXT}` })} />
      );

      // Act
      const undone = editor.undo();

      // Assert
      expect(undone).toBe(true);
      expect(editor.text).toBe(TEXT);
    });

    it("should start with an empty history when there is no snapshot", () => {
      // Arrange
      const editor = new ConfigEditorPom();
      const first = render(<ConfigEditor {...createProps()} />);
      editor.typeAt(0, " ");
      first.unmount();
      render(<ConfigEditor {...createProps({ value: ` ${TEXT}` })} />);

      // Act
      const undone = editor.undo();

      // Assert
      expect(undone).toBe(false);
    });

    it("should keep the selection when it mounts again", () => {
      // Arrange
      const snapshot = createSnapshot();
      const editor = new ConfigEditorPom();
      const first = render(<ConfigEditor {...createProps({ snapshot })} />);
      editor.select(4, 9);
      first.unmount();

      // Act
      render(<ConfigEditor {...createProps({ snapshot })} />);

      // Assert
      expect(editor.selection).toEqual({ anchor: 4, head: 9 });
    });

    it("should scroll to where it was left when it mounts again", () => {
      // Arrange
      const snapshot = createSnapshot();
      const editor = new ConfigEditorPom();
      const first = render(<ConfigEditor {...createProps({ snapshot })} />);
      editor.scrollTo(120);
      first.unmount();
      const scrollLeft = snapshot.current?.scroll;

      // Act
      render(<ConfigEditor {...createProps({ snapshot })} />);

      // Assert
      expect(scrollLeft).toBeDefined();
      expect(editor.hasPendingScroll).toBe(true);
    });

    it("should have no scroll to apply when it starts without a snapshot", () => {
      // Act
      render(<ConfigEditor {...createProps()} />);

      // Assert
      expect(new ConfigEditorPom().hasPendingScroll).toBe(false);
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
      render(
        <ConfigEditor
          {...createProps({ snapshot, onChange: onChangeOfSecond })}
        />
      );

      // Act
      new ConfigEditorPom().typeAt(0, " ");

      // Assert
      expect(onChangeOfFirst).not.toHaveBeenCalled();
      expect(onChangeOfSecond).toHaveBeenCalledTimes(1);
      expect(onChangeOfSecond).toHaveBeenCalledWith(` ${TEXT}`, null);
    });

    it("should report an edit once after a double mount, as the development mode of React does", () => {
      // Arrange
      const snapshot = createSnapshot();
      const props = createProps({ snapshot });
      render(
        <StrictMode>
          <ConfigEditor {...props} />
        </StrictMode>
      );
      const editor = new ConfigEditorPom();

      // Act
      editor.typeAt(0, " ");

      // Assert
      expect(editor.editorCount).toBe(1);
      expect(props.onChange).toHaveBeenCalledTimes(1);
    });

    it("should start from the value when the document of the snapshot differs from it", () => {
      // Arrange
      const snapshot = createSnapshot();
      const first = render(<ConfigEditor {...createProps({ snapshot })} />);
      first.unmount();
      const props = createProps({ snapshot, value: "{}" });

      // Act
      render(<ConfigEditor {...props} />);

      // Assert
      expect(new ConfigEditorPom().text).toBe("{}");
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
      render(
        <ConfigEditor {...createProps({ snapshot, problems: [ERROR] })} />
      );

      // Assert
      const editor = new ConfigEditorPom();

      expect(editor.diagnostics).toHaveLength(1);
      expect(editor.underlinedText("warning")).toBeNull();
    });

    it("should honor read only after it mounts again", () => {
      // Arrange
      const snapshot = createSnapshot();
      const first = render(<ConfigEditor {...createProps({ snapshot })} />);
      first.unmount();
      render(<ConfigEditor {...createProps({ snapshot, readOnly: true })} />);
      const editor = new ConfigEditorPom();

      // Act
      editor.pressEnter();

      // Assert
      expect(editor.text).toBe(TEXT);
    });
  });

  describe("lifecycle", () => {
    it("should create the view once, however many times it renders", () => {
      // Arrange
      const props = createProps();
      const { rerender } = render(<ConfigEditor {...props} />);
      const editor = new ConfigEditorPom();
      const viewBefore = editor.viewId;

      // Act
      rerender(<ConfigEditor {...props} problems={[ERROR]} />);
      rerender(<ConfigEditor {...props} value="{}" />);

      // Assert
      expect(editor.editorCount).toBe(1);
      expect(editor.viewId).toBe(viewBefore);
    });

    it("should destroy the view on unmount", () => {
      // Arrange
      const editor = new ConfigEditorPom();
      const destroys = ConfigEditorPom.recordDestroys();
      const { unmount } = render(<ConfigEditor {...createProps()} />);

      // Act
      unmount();

      // Assert
      expect(destroys.count).toBe(1);
      expect(editor.editorCount).toBe(0);
    });
  });
});
