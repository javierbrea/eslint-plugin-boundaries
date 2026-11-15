// cspell:ignore dissallow -- a deliberate typo, the mistake of the config that the test reports
import { render } from "@testing-library/react";
import type { RefObject } from "react";

import { ConfigEditorPom } from "@/domains/config/ui/atoms/ConfigEditor/ConfigEditor.pom";
import type { ConfigEditorSnapshot } from "@/domains/config/ui/contexts/ConfigEditorSnapshotContext";
import type {
  ConfigProblem,
  TextRange,
} from "@/domains/evaluation/helpers/engine";

import { ConfigPane } from "./ConfigPane";
import { ConfigPanePom } from "./ConfigPane.pom";
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
  links: [],
  path: ["rules", "boundaries/dependencies", 1, "default"],
  range: OPTION_RANGE,
  source: "config",
};

const FRAME_LABEL = "Pane under test";

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
    onClose: jest.fn(),
    frameLabel: FRAME_LABEL,
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

describe("ConfigPane", () => {
  it("should be the landmark that its label names", () => {
    // Arrange
    render(<ConfigPane {...createProps()} />);
    const pane = new ConfigPanePom();

    // Act
    const { frame } = pane;
    const { tagName } = frame;
    const isNamedRegion = frame.isRegionNamed(FRAME_LABEL);

    // Assert
    expect(isNamedRegion).toBe(true);
    expect(tagName).toBe("SECTION");
  });

  it("should show the config label and the name of the file in the head", () => {
    // Arrange
    render(<ConfigPane {...createProps()} />);
    const pane = new ConfigPanePom();

    // Act
    const { label, labelTag, path, pathTitle } = pane.head;

    // Assert
    expect(label).toBe("Config");
    expect(labelTag).toBe("SPAN");
    expect(path).toBe("eslint.config.js");
    expect(pathTitle).toBe("eslint.config.js");
  });

  it("should draw the button that closes the config between the name of the file and the hint, named after the file", () => {
    // Arrange
    render(<ConfigPane {...createProps()} />);
    const pane = new ConfigPanePom();

    // Act
    const { itemTexts, hint } = pane.head;
    const isNamed = pane.closeButton.isButtonNamed("Close eslint.config.js");

    // Assert
    expect(itemTexts).toEqual(["Config", "eslint.config.js", "", hint]);
    expect(isNamed).toBe(true);
  });

  it("should report that the user pressed the close button", () => {
    // Arrange
    const props = createProps();
    render(<ConfigPane {...props} />);
    const pane = new ConfigPanePom();

    // Act
    pane.closeButton.press();

    // Assert
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("should say in the hint that the config is JSON5, with the settings and the rules in mono", () => {
    // Arrange
    render(<ConfigPane {...createProps()} />);
    const pane = new ConfigPanePom();

    // Act
    const { hint, hintCodeTexts } = pane.head;

    // Assert
    expect(hint).toBe("JSON5 · the settings and rules of an ESLint config");
    expect(hintCodeTexts).toEqual(["settings", "rules"]);
  });

  it("should keep the words of the hint free of the box that a host gives to code", () => {
    // Arrange
    render(<ConfigPane {...createProps()} />);
    const pane = new ConfigPanePom();

    // Act
    const { padding, backgroundColor, fontSize, fontFamily } =
      pane.code("settings");

    // Assert
    expect(padding).toBe("0px");
    expect(backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(fontSize).toBe("inherit");
    expect(fontFamily).toBe("var(--jsb-font-mono)");
  });

  it("should show the config in an editor that is named after the file", () => {
    // Arrange
    render(<ConfigPane {...createProps()} />);
    const pane = new ConfigPanePom();

    // Act
    const { renderedText } = pane.editorNamed("eslint.config.js");

    // Assert
    expect(renderedText).toBe(CONFIG);
  });

  it("should call onChange with the whole text after an edit of the user", () => {
    // Arrange
    const props = createProps();
    render(<ConfigPane {...props} />);
    const { editor } = new ConfigPanePom();

    // Act
    editor.typeAt(CONFIG.length, "\n// done");

    // Assert
    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith(`${CONFIG}\n// done`, null);
  });

  it("should call onChange with the text and where the highlight is after an edit before it", () => {
    // Arrange
    const props = createProps({ highlight: OPTION_RANGE });
    render(<ConfigPane {...props} />);
    const { editor } = new ConfigPanePom();

    // Act
    editor.typeAt(0, "// done\n");

    // Assert
    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith(`// done\n${CONFIG}`, {
      from: OPTION_RANGE.from + 8,
      to: OPTION_RANGE.to + 8,
      line: OPTION_RANGE.line + 1,
      // The editor reads the column from the text, and does not copy the one of the range it was given
      column: 47,
    });
  });

  it("should let the user edit the text by default", () => {
    // Arrange
    render(<ConfigPane {...createProps()} />);
    const { editor } = new ConfigPanePom();

    // Act
    const { isReadOnly } = editor;

    // Assert
    expect(isReadOnly).toBe(false);
  });

  it("should not let the user edit the text when it is read-only", () => {
    // Arrange
    render(<ConfigPane {...createProps({ readOnly: true })} />);
    const { editor } = new ConfigPanePom();

    // Act
    const { isReadOnly } = editor;

    // Assert
    expect(isReadOnly).toBe(true);
  });

  it("should mark the problems at their ranges", () => {
    // Arrange
    const props = createProps({ problems: [PROBLEM] });

    // Act
    render(<ConfigPane {...props} />);
    const { diagnostics } = new ConfigPanePom().editor;

    // Assert
    expect(diagnostics.map(({ from, to }) => ({ from, to }))).toEqual([
      { from: OPTION_RANGE.from, to: OPTION_RANGE.to },
    ]);
  });

  it("should mark the problems that come with a later render", () => {
    // Arrange
    const props = createProps();
    const { rerender } = render(<ConfigPane {...props} />);

    // Act
    rerender(<ConfigPane {...props} problems={[PROBLEM]} />);

    // Assert
    expect(new ConfigPanePom().editor.diagnostics).toHaveLength(1);
  });

  it("should scroll to the range to reveal and put the cursor at its start", () => {
    // Arrange
    const props = createProps({ reveal: { range: OPTION_RANGE, key: 1 } });

    // Act
    render(<ConfigPane {...props} />);

    // Assert
    expect(new ConfigPanePom().editor.cursor).toBe(OPTION_RANGE.from);
  });

  it("should mark the lines to highlight", () => {
    // Arrange
    const props = createProps({ highlight: OPTION_RANGE });

    // Act
    render(<ConfigPane {...props} />);

    // Assert
    expect(new ConfigPanePom().editor.highlightedLines).toEqual([4]);
  });

  describe("snapshot", () => {
    it("should leave the state of the editor in the snapshot when the pane closes", () => {
      // Arrange
      const snapshot = createSnapshot();
      const { unmount } = render(<ConfigPane {...createProps({ snapshot })} />);
      new ConfigPanePom().editor.typeAt(CONFIG.length, "\n// done");

      // Act
      unmount();

      // Assert
      expect(ConfigEditorPom.textOfSnapshot(snapshot.current)).toBe(
        `${CONFIG}\n// done`
      );
    });

    it("should keep the undo history of the editor when the pane opens again", () => {
      // Arrange
      const snapshot = createSnapshot();
      const first = render(<ConfigPane {...createProps({ snapshot })} />);
      new ConfigPanePom().editor.typeAt(CONFIG.length, "\n// done");
      first.unmount();
      render(
        <ConfigPane
          {...createProps({ snapshot, config: `${CONFIG}\n// done` })}
        />
      );
      const { editor } = new ConfigPanePom();

      // Act
      const undone = editor.undo();

      // Assert
      expect(undone).toBe(true);
      expect(editor.text).toBe(CONFIG);
    });

    it("should start from the config when there is no snapshot", () => {
      // Arrange
      const first = render(<ConfigPane {...createProps()} />);
      new ConfigPanePom().editor.typeAt(CONFIG.length, "\n// done");
      first.unmount();
      render(<ConfigPane {...createProps({ config: `${CONFIG}\n// done` })} />);

      // Act
      const undone = new ConfigPanePom().editor.undo();

      // Assert
      expect(undone).toBe(false);
    });
  });

  it("should give the editor the height that the head leaves", () => {
    // Arrange
    render(<ConfigPane {...createProps()} />);
    const pane = new ConfigPanePom();

    // Act
    const { editorSlotFlexGrow, editorSlotMinHeight } = pane;

    // Assert
    expect(editorSlotFlexGrow).toBe("1");
    expect(editorSlotMinHeight).toBe("0");
  });
});
