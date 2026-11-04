// cspell:ignore dissallow -- a deliberate typo, the mistake of the config that the test reports
import { forEachDiagnostic } from "@codemirror/lint";
import type { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { render, screen as view } from "@testing-library/react";

import type { ConfigProblem, TextRange } from "../../engine";
import { highlightField } from "../config/Highlight";

import { ConfigPane } from "./ConfigPane";
import type { ConfigPaneProps } from "./ConfigPane.types";

const CONFIG = [
  "{",
  "  settings: {},",
  "  rules: {",
  '    "boundaries/dependencies": [2, { default: "dissallow" }],',
  "  },",
  "}",
].join("\n");

const OPTION = '"dissallow"';

const OPTION_RANGE: TextRange = {
  from: CONFIG.indexOf(OPTION),
  to: CONFIG.indexOf(OPTION) + OPTION.length,
  line: 4,
  column: 49,
};

const PROBLEM: ConfigProblem = {
  level: "error",
  title: "[boundaries/dependencies] Invalid rule options.",
  detail: 'Value "dissallow" should be equal to one of the allowed values.',
  path: ["rules", "boundaries/dependencies", 1, "default"],
  range: OPTION_RANGE,
  source: "config",
};

/**
 * Creates the props of the pane.
 * @param overrides What differs from a config that can be edited and has no problems.
 * @returns The props.
 */
function createProps(
  overrides: Partial<ConfigPaneProps> = {}
): ConfigPaneProps {
  return {
    config: CONFIG,
    problems: [],
    readOnly: false,
    onChange: jest.fn(),
    ...overrides,
  };
}

/**
 * Finds the CodeMirror view of the editor.
 * @param container The element the pane was rendered in.
 * @returns The view.
 */
function getEditorView(container: HTMLElement): EditorView {
  const editor = container.querySelector(".cm-editor") as HTMLElement;
  const found = EditorView.findFromDOM(editor);

  expect(found).not.toBeNull();

  return found as EditorView;
}

/**
 * Reads the places of the diagnostics of a state.
 * @param state The state of the editor.
 * @returns The offsets of each diagnostic.
 */
function getDiagnosticRanges(
  state: EditorState
): { from: number; to: number }[] {
  const ranges: { from: number; to: number }[] = [];
  forEachDiagnostic(state, (_diagnostic, from, to) => {
    ranges.push({ from, to });
  });
  return ranges;
}

describe("ConfigPane", () => {
  it("should be the landmark of the node in focus", () => {
    // Arrange
    render(<ConfigPane {...createProps()} />);

    // Act
    const landmark = view.getByRole("region", { name: "Node in focus" });

    // Assert
    expect(landmark.tagName).toBe("SECTION");
  });

  it("should show the config label and the name of the file in the head", () => {
    // Arrange
    render(<ConfigPane {...createProps()} />);

    // Act
    const path = view.getByText("eslint.config.js", { selector: "span" });

    // Assert
    expect(view.getByText("Config").tagName).toBe("SPAN");
    expect(path.getAttribute("title")).toBe("eslint.config.js");
  });

  it("should say in the hint that the config is JSON5, with the settings and the rules in mono", () => {
    // Arrange
    render(<ConfigPane {...createProps()} />);

    // Act
    const hint = view.getByText(/^JSON5 · the/);

    // Assert
    expect(hint.textContent).toBe(
      "JSON5 · the settings and rules of an ESLint config"
    );
    expect(
      Array.from(hint.querySelectorAll("code")).map((code) => code.textContent)
    ).toEqual(["settings", "rules"]);
  });

  it("should keep the words of the hint free of the box that a host gives to code", () => {
    // Arrange
    render(<ConfigPane {...createProps()} />);

    // Act
    const style = getComputedStyle(
      view.getByText("settings", { selector: "code" })
    );

    // Assert
    expect(style.padding).toBe("0px");
    expect(style.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(style.fontSize).toBe("inherit");
    expect(style.fontFamily).toBe("var(--jsb-font-mono)");
  });

  it("should show the config in an editor that is named after the file", () => {
    // Arrange
    render(<ConfigPane {...createProps()} />);

    // Act
    const editor = view.getByRole("textbox", { name: "eslint.config.js" });

    // Assert
    expect(
      Array.from(editor.querySelectorAll(".cm-line"))
        .map((line) => line.textContent)
        .join("\n")
    ).toBe(CONFIG);
  });

  it("should call onChange with the whole text after an edit of the user", () => {
    // Arrange
    const props = createProps();
    const { container } = render(<ConfigPane {...props} />);

    // Act
    getEditorView(container).dispatch({
      changes: { from: CONFIG.length, insert: "\n// done" },
      userEvent: "input.type",
    });

    // Assert
    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith(`${CONFIG}\n// done`);
  });

  it("should let the user edit the text by default", () => {
    // Arrange
    const { container } = render(<ConfigPane {...createProps()} />);

    // Act
    const { readOnly } = getEditorView(container).state;

    // Assert
    expect(readOnly).toBe(false);
  });

  it("should not let the user edit the text when it is read-only", () => {
    // Arrange
    const { container } = render(
      <ConfigPane {...createProps({ readOnly: true })} />
    );

    // Act
    const { readOnly } = getEditorView(container).state;

    // Assert
    expect(readOnly).toBe(true);
  });

  it("should mark the problems at their ranges", () => {
    // Arrange
    const props = createProps({ problems: [PROBLEM] });

    // Act
    const { container } = render(<ConfigPane {...props} />);

    // Assert
    expect(getDiagnosticRanges(getEditorView(container).state)).toEqual([
      { from: OPTION_RANGE.from, to: OPTION_RANGE.to },
    ]);
  });

  it("should mark the problems that come with a later render", () => {
    // Arrange
    const props = createProps();
    const { container, rerender } = render(<ConfigPane {...props} />);

    // Act
    rerender(<ConfigPane {...props} problems={[PROBLEM]} />);

    // Assert
    expect(getDiagnosticRanges(getEditorView(container).state)).toHaveLength(1);
  });

  it("should scroll to the range to reveal and put the cursor at its start", () => {
    // Arrange
    const props = createProps({ reveal: { range: OPTION_RANGE, key: 1 } });

    // Act
    const { container } = render(<ConfigPane {...props} />);

    // Assert
    expect(getEditorView(container).state.selection.main.head).toBe(
      OPTION_RANGE.from
    );
  });

  it("should mark the lines to highlight", () => {
    // Arrange
    const props = createProps({ highlight: OPTION_RANGE });

    // Act
    const { container } = render(<ConfigPane {...props} />);

    // Assert
    const lines: number[] = [];
    const { state } = getEditorView(container);
    state.field(highlightField).between(0, state.doc.length, (from) => {
      lines.push(state.doc.lineAt(from).number);
    });

    expect(lines).toEqual([4]);
  });

  it("should give the editor the height that the head leaves", () => {
    // Arrange
    const { container } = render(<ConfigPane {...createProps()} />);

    // Act
    const slot = (container.querySelector(".cm-editor") as HTMLElement)
      .parentElement?.parentElement as HTMLElement;
    const style = getComputedStyle(slot);

    // Assert
    expect(style.flexGrow).toBe("1");
    expect(style.minHeight).toBe("0");
  });
});
