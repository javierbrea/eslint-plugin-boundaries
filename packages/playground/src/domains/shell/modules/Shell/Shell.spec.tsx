// cspell:ignore patern dissallow -- deliberate typos, the mistakes of the config that the tests show
import { act, render } from "@testing-library/react";

import type { ProjectCapabilities, Sketch } from "@/contract";
import { createEngine } from "@/domains/evaluation/helpers/engine";
import {
  EXAMPLES,
  QUICK_START_EXAMPLE,
} from "@/domains/examples/data/examples";
import type { ProblemRowPom } from "@/domains/problems/ui/molecules/ProblemList/ProblemList.pom";
import { FixturePom } from "@/shared/testing/pom";
import { stubResizeObserver } from "@/shared/testing/resizeObserver";
import { ThemeRoot } from "@/ui-kit/providers/ThemeRoot";

import { Shell } from "./Shell";
import { ShellPom } from "./Shell.pom";
import type { ShellProps } from "./Shell.types";

const EDITABLE: ProjectCapabilities = {
  editTree: true,
  editDependencies: true,
  editConfig: true,
};

const READ_ONLY: ProjectCapabilities = {
  editTree: false,
  editDependencies: false,
  editConfig: false,
};

// The cases of the panes of phase 5 read the files and the config of the quick start, without its dependencies, whose verdicts the cases of the dependencies read from the whole example
const QUICK_START: Sketch = { ...QUICK_START_EXAMPLE.sketch, dependencies: [] };

const { evaluate } = createEngine();

const CONFIG = "eslint.config.js";

const FILE = "src/modules/checkout/index.js";

const OTHER_FILE = "src/helpers/format/index.js";

// The whole example: the files and the config of the quick start, with the nine dependencies whose verdicts the cases of the dependencies read
const EXAMPLE: Sketch = QUICK_START_EXAMPLE.sketch;

const BUTTON = "src/components/atoms/Button/index.js";

const BUTTON_SPEC = "src/components/atoms/Button/Button.spec.js";

/** The quick-start config with the two mistakes of the mockup: a wrong option of the rule, which is an error, and a wrong key of an element descriptor, which is a warning */
const MISTAKES: Sketch = {
  ...QUICK_START,
  config: QUICK_START.config
    .replace('default: "disallow"', 'default: "dissallow"')
    .replace('pattern: "components/*/*"', 'patern: "components/*/*"'),
};

/** The quick-start config with the mistake that is only a warning */
const WARNING_ONLY: Sketch = {
  ...QUICK_START,
  config: QUICK_START.config.replace(
    'pattern: "components/*/*"',
    'patern: "components/*/*"'
  ),
};

/** The additional dependency node of {@link WITH_ADDITIONAL_NODES}, as the config writes it */
const ADDITIONAL_NODES =
  '[{ selector: "ImportDeclaration > Literal", kind: "value", name: "custom" }]';

/** The quick-start config with a valid additional dependency node, whose selector the playground does not run: one warning, at the setting, which is on line 8 */
const WITH_ADDITIONAL_NODES: Sketch = {
  ...QUICK_START,
  config: QUICK_START.config.replace(
    '    "boundaries/files": [',
    `    "boundaries/additional-dependency-nodes": ${ADDITIONAL_NODES},\n    "boundaries/files": [`
  ),
};

const NOTE_TEXT =
  "Dependencies are not evaluated while the rule options are invalid: ESLint does not run a rule whose options fail its schema.";

/** The test id of the probe element that {@link renderShellInProbe} mounts the shell in. */
const PROBE_TEST_ID = "probe";

const EVALUATION_WAIT = 150;

const TEXT_READ_WAIT = 300;

/** The spy that receives each sketch an edit makes. */
type SketchSpy = jest.Mock<void, [Sketch]>;

/** What {@link renderShell} returns: the page object of the shell, the spy that receives each new sketch, and the way to render the same shell again with other props. */
type ShellRender = {
  readonly shell: ShellPom;
  readonly onSketchChange: SketchSpy;
  readonly rerender: (overrides: Partial<ShellProps>) => void;
};

/**
 * Builds the props of an editable shell of the quick-start sketch.
 * @param overrides What differs from it.
 * @returns The props, with a spy for the sketches unless the overrides have a callback.
 */
function propsOf(overrides: Partial<ShellProps> = {}): ShellProps {
  return {
    initialSketch: QUICK_START,
    capabilities: EDITABLE,
    onSketchChange: jest.fn(),
    onReset: jest.fn(),
    onSelectExample: jest.fn(),
    ...overrides,
  };
}

/**
 * Renders the shell.
 * @param overrides What differs from an editable shell of the quick-start sketch.
 * @returns The page object of the shell, the mock that receives each new sketch, and the way to render it again.
 */
function renderShell(overrides: Partial<ShellProps> = {}): ShellRender {
  const onSketchChange: SketchSpy = jest.fn();
  const props = propsOf({ onSketchChange, ...overrides });
  const { rerender } = render(<Shell {...props} />);

  return {
    shell: new ShellPom(),
    onSketchChange,
    rerender: (changes) => rerender(<Shell {...props} {...changes} />),
  };
}

/**
 * Renders an editable shell of the quick-start sketch inside a probe element, so that a case can assert on everything the shell renders, and not only on the parts that its page object reaches.
 * @returns The page object of the probe.
 */
function renderShellInProbe(): FixturePom {
  render(
    <div data-testid={PROBE_TEST_ID}>
      <Shell {...propsOf()} />
    </div>
  );

  return new FixturePom({ testId: PROBE_TEST_ID });
}

/**
 * Renders the shell of the whole example in the root element of the playground, as the `Playground` component does: the dialogs of the shell render inside it, and its theme applies.
 * @param overrides What differs from an editable shell of the whole example.
 * @returns The page object of the shell.
 */
function renderExample(overrides: Partial<ShellProps> = {}): ShellPom {
  render(
    <ThemeRoot>
      <Shell {...propsOf({ initialSketch: EXAMPLE, ...overrides })} />
    </ThemeRoot>
  );

  return new ShellPom();
}

/**
 * Adds a dependency to the open file with the picker, as the user does: `import { <name> } from "<path>";`.
 * @param shell The shell, with the file open.
 * @param path The path of the file the dependency points to.
 * @param specifier The name it imports.
 * @param options What differs from a user who confirms the name before adding the dependency.
 * @param options.confirmName Whether the user presses the button that adds the name, or leaves it typed and adds the dependency.
 * @returns A promise that settles when the picker is gone.
 */
async function addDependencyOf(
  shell: ShellPom,
  path: string,
  specifier: string,
  { confirmName = true }: { readonly confirmName?: boolean } = {}
): Promise<void> {
  const { picker } = shell.node.file;

  shell.node.file.addButton.press();
  picker.file.open();
  picker.file.choose(path);
  picker.names.openEditor();
  picker.names.chooseKind("named");
  picker.names.typeName(specifier);
  if (confirmName) {
    picker.names.confirm();
  }
  picker.confirm();
  await picker.waitUntilGone();
}

/**
 * Renders two shells on the same page.
 * @param first The props of the first shell.
 * @param second The props of the second shell.
 * @returns The page objects of the first and the second shell.
 */
function renderShells(
  first: ShellProps,
  second: ShellProps
): { first: ShellPom; second: ShellPom } {
  render(
    <>
      <section aria-label="First">
        <Shell {...first} />
      </section>
      <section aria-label="Second">
        <Shell {...second} />
      </section>
    </>
  );

  return {
    first: new ShellPom({ index: 0 }),
    second: new ShellPom({ index: 1 }),
  };
}

/** Everything that `jest.useFakeTimers` fakes but the timeouts: CodeMirror measures in animation frames, which jsdom cannot, and the tests need only the delays of the shell */
const REAL_TIMERS = [
  "Date",
  "hrtime",
  "nextTick",
  "performance",
  "queueMicrotask",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "requestIdleCallback",
  "cancelIdleCallback",
  "setImmediate",
  "clearImmediate",
  "setInterval",
  "clearInterval",
] as const;

/** Fakes the timeouts, which are the delays of the shell: 150 ms to evaluate and 300 ms to read the text */
function useFakeTimeouts(): void {
  jest.useFakeTimers({ doNotFake: [...REAL_TIMERS] });
}

/**
 * Lets the delays of the shell go by.
 * @param milliseconds How long.
 */
function wait(milliseconds: number): void {
  act(() => {
    jest.advanceTimersByTime(milliseconds);
  });
}

/**
 * Reads the tabs of the problems panel.
 * @param shell The shell.
 * @returns The text of each tab, with `*` after the selected one.
 */
function getTabs(shell: ShellPom): string[] {
  return shell.problems.tabs.map(
    (tab) => `${tab.text}${tab.isSelected ? "*" : ""}`
  );
}

/**
 * Reads the status of the top bar.
 * @param shell The shell.
 * @returns The text of the status.
 */
function getStatus(shell: ShellPom): string {
  return shell.topBar.bar.statusText;
}

/**
 * Gets the row of the problem list that starts with a location and opens something.
 * @param shell The shell.
 * @param startsWith What the row says first, such as `eslint.config.js:15:16`.
 * @returns The row.
 * @throws When no row that opens something starts with it.
 */
function getProblemRow(shell: ShellPom, startsWith: string): ProblemRowPom {
  const found = shell.problems.list.rows.find(
    (row) => row.opens && row.text.startsWith(startsWith)
  );

  if (found === undefined) {
    throw new Error(
      `No problem that opens something starts with ${startsWith}`
    );
  }

  return found;
}

/**
 * Gets the item of the problem list that starts with a location, whether it opens something or not.
 * @param shell The shell.
 * @param startsWith What the item says first, such as `Project text:9`.
 * @returns The item.
 * @throws When no item starts with it.
 */
function getProblemItem(shell: ShellPom, startsWith: string): ProblemRowPom {
  const found = shell.problems.list.rows.find((row) =>
    row.text.startsWith(startsWith)
  );

  if (found === undefined) {
    throw new Error(`No problem starts with ${startsWith}`);
  }

  return found;
}

/**
 * Lists the paths of the tree of a sketch.
 * @param sketch The sketch.
 * @returns The path of each node.
 */
function getPaths(sketch: Sketch): string[] {
  return sketch.tree.map(({ path }) => path);
}

describe("Shell", () => {
  beforeEach(() => {
    stubResizeObserver();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("layout", () => {
    it("should lay out the project, the node in focus, the inspector and the problems", () => {
      // Act
      const { shell } = renderShell();
      const landmarks = {
        project: shell.project.layout.isRegionNamed("Project"),
        inspector: shell.inspector.layout.isComplementaryNamed("Inspector"),
        problems: shell.problems.panel.isRegionNamed("Problems"),
      };

      // Assert
      expect(shell.layout.isRegionNamed("Playground")).toBe(true);
      expect(shell.node.frame.isRegionNamed("Node in focus")).toBe(true);
      expect(landmarks).toEqual({
        project: true,
        inspector: true,
        problems: true,
      });
    });

    it("should separate the regions with separators the keyboard reaches", () => {
      // Act
      const probe = renderShellInProbe();

      // Assert
      expect(probe.countByRole("separator")).toBe(3);
    });

    it("should leave the decision about narrow screens to the host", () => {
      // Act
      const probe = renderShellInProbe();

      // Assert
      expect(probe.holds(/needs a wider screen/)).toBe(false);
    });
  });

  describe("status", () => {
    it("should count the files and the problems of the sketch", () => {
      // Act
      const { shell } = renderShell();

      // Assert
      expect(getStatus(shell)).toBe("6 files · 0 dependencies · 0 problems");
    });

    it("should say that the config has errors when it has", () => {
      // Act
      const { shell } = renderShell({ initialSketch: MISTAKES });

      // Assert
      expect(getStatus(shell)).toBe(
        "6 files · 0 dependencies · config has errors"
      );
    });

    it("should count the problems of a config that has only warnings, and not say it has errors", () => {
      // Act
      const { shell } = renderShell({ initialSketch: WARNING_ONLY });

      // Assert
      expect(getStatus(shell)).toBe("6 files · 0 dependencies · 1 problem");
    });

    it("should count the files with the sketch that an edit of the tree makes, at once", () => {
      // Arrange
      useFakeTimeouts();
      const { shell } = renderShell();

      // Act
      shell.project.item("src/index.js").deleteAction.press();

      // Assert
      expect(getStatus(shell)).toBe("5 files · 0 dependencies · 0 problems");
    });

    it("should count the files at once after a node is added and after one is renamed", () => {
      // Arrange
      useFakeTimeouts();
      const { shell } = renderShell();

      // Act
      shell.project.foot.addFile();
      const added = getStatus(shell);
      shell.project.item("new-file.js").field.pressKey("Escape");
      shell.project.rename("src/index.js", "main.spec.js");

      // Assert
      expect(added).toBe("7 files · 0 dependencies · 0 problems");
      expect(getStatus(shell)).toBe("7 files · 0 dependencies · 0 problems");
      expect(shell.project.item("src/main.spec.js").isRendered).toBe(true);
    });

    it("should count the files at once after the text of the project is read", () => {
      // Arrange
      useFakeTimeouts();
      const { shell } = renderShell();
      shell.project.foot.pressView("Text");

      // Act
      shell.project.text.type(`${shell.project.text.value}\nsrc/extra.js`);
      wait(TEXT_READ_WAIT);

      // Assert
      expect(getStatus(shell)).toBe("7 files · 0 dependencies · 0 problems");
    });

    it("should evaluate the config together with the tree when an edit of the tree comes before the config is evaluated", () => {
      // Arrange
      useFakeTimeouts();
      const { shell } = renderShell();
      shell.project.click(CONFIG);
      const at = QUICK_START.config.indexOf('"disallow"');

      // Act
      shell.node.config.editor.replaceText(
        at,
        at + '"disallow"'.length,
        '"dissallow"'
      );
      shell.project.item("src/index.js").deleteAction.press();

      // Assert
      expect(getStatus(shell)).toBe(
        "5 files · 0 dependencies · config has errors"
      );
    });
  });

  describe("nothing open", () => {
    it("should start with nothing open", () => {
      // Act
      const { shell } = renderShell();

      // Assert
      expect(shell.node.shown).toBe("empty");
      expect(shell.node.empty.title).toBe("Open a file or the config");
    });

    it("should describe the sketch in the inspector", () => {
      // Act
      const { shell } = renderShell();

      // Assert
      const { project } = shell.inspector;

      expect(project.title.text).toBe("Sketch");
      expect(project.count("files")).toBe("6");
    });

    it("should have the sketch tab only, selected, with no problems", () => {
      // Act
      const { shell } = renderShell();

      // Assert
      expect(getTabs(shell)).toEqual(["Sketch*"]);
      expect(shell.problems.list.emptyText).toBe("No problems in the sketch.");
    });

    it("should open the config from the button of the empty pane", () => {
      // Arrange
      const { shell } = renderShell();

      // Act
      shell.node.empty.openConfigButton.press();

      // Assert
      expect(shell.node.config.editorNamed(CONFIG).isRendered).toBe(true);
      expect(getTabs(shell)).toEqual(["Sketch", "eslint.config.js*"]);
    });

    it("should add a file at the root and open it from the button of the empty pane", () => {
      // Arrange
      const { shell, onSketchChange } = renderShell();

      // Act
      shell.node.empty.addFileButton.press();

      // Assert
      expect(shell.node.file.head.path).toBe("new-file.js");
      expect(
        shell.project
          .item("new-file.js")
          .field.isTextboxNamed("New name of new-file.js")
      ).toBe(true);
      expect(onSketchChange).toHaveBeenCalledTimes(1);
      expect(getPaths(onSketchChange.mock.calls[0][0])).toContain(
        "new-file.js"
      );
    });

    it("should add the file the way the tree does: opened, with the tree showing and its name being edited", () => {
      // Arrange
      const { shell } = renderShell();

      // Act
      shell.node.empty.addFileButton.press();

      // Assert
      const item = shell.project.item("new-file.js");

      expect(item.field.isTextboxNamed("New name of new-file.js")).toBe(true);
      expect(item.field.isFocused).toBe(true);
      expect(getTabs(shell)).toEqual(["Sketch", "new-file.js*"]);
      expect(item.ariaSelected).toBe("true");
    });

    it("should add the file in the folder that the user picked in the tree", () => {
      // Arrange
      const { shell, onSketchChange } = renderShell();
      shell.project.click("src/modules");

      // Act
      shell.node.empty.addFileButton.press();

      // Assert
      expect(getPaths(onSketchChange.mock.lastCall?.[0] as Sketch)).toContain(
        "src/modules/new-file.js"
      );
      expect(shell.node.file.head.path).toBe("src/modules/new-file.js");
    });

    it("should add the file at the root when no folder is picked", () => {
      // Arrange
      const { shell, onSketchChange } = renderShell();

      // Act
      shell.node.empty.addFileButton.press();

      // Assert
      expect(getPaths(onSketchChange.mock.lastCall?.[0] as Sketch)).toContain(
        "new-file.js"
      );
    });

    it("should show the tree, where the name is edited, when the project was shown as text", () => {
      // Arrange
      const { shell } = renderShell();
      shell.project.foot.pressView("Text");

      // Act
      shell.node.empty.addFileButton.press();

      // Assert
      expect(shell.project.text.isRendered).toBe(false);
      expect(
        shell.project
          .item("new-file.js")
          .field.isTextboxNamed("New name of new-file.js")
      ).toBe(true);
    });

    it("should count the new file at once", () => {
      // Arrange
      useFakeTimeouts();
      const { shell } = renderShell();

      // Act
      shell.node.empty.addFileButton.press();

      // Assert
      expect(getStatus(shell)).toBe("7 files · 0 dependencies · 0 problems");
    });

    it("should give the file it adds a name that is free", () => {
      // Arrange
      const { shell } = renderShell({
        initialSketch: {
          ...QUICK_START,
          tree: [...QUICK_START.tree, { path: "new-file.js", kind: "file" }],
        },
      });

      // Act
      shell.node.empty.addFileButton.press();

      // Assert
      expect(shell.node.file.head.path).toBe("new-file-2.js");
    });

    it("should not offer to add a file when the project cannot be edited", () => {
      // Act
      const { shell } = renderShell({ capabilities: READ_ONLY });

      // Assert
      expect(shell.node.empty.addFileButton.isRendered).toBe(false);
    });
  });

  describe("a file", () => {
    it("should open it in the node pane from the tree", () => {
      // Arrange
      const { shell } = renderShell();

      // Act
      shell.project.click(FILE);

      // Assert
      expect(shell.node.file.head.label).toBe("File");
      expect(shell.node.file.head.path).toBe(FILE);
    });

    it("should describe it in the inspector", () => {
      // Arrange
      const { shell } = renderShell();

      // Act
      shell.project.click(FILE);

      // Assert
      const { file } = shell.inspector;

      expect(file.title(FILE).isRendered).toBe(true);
      expect(file.facet("element").isRendered).toBe(true);
      expect(file.facet("element").entries.types).toBe('[ "module" ]');
    });

    it("should add its tab to the problems and select it", () => {
      // Arrange
      const { shell } = renderShell();

      // Act
      shell.project.click(FILE);

      // Assert
      expect(getTabs(shell)).toEqual(["Sketch", "checkout/index.js*"]);
      expect(shell.problems.list.emptyText).toBe("No problems in this file.");
    });

    it("should change to the tab of another file when another file is opened", () => {
      // Arrange
      const { shell } = renderShell();
      shell.project.click(FILE);

      // Act
      shell.project.click(OTHER_FILE);

      // Assert
      expect(getTabs(shell)).toEqual(["Sketch", "format/index.js*"]);
    });
  });

  describe("the config", () => {
    it("should open the editor from the tree", () => {
      // Arrange
      const { shell } = renderShell();

      // Act
      shell.project.click(CONFIG);

      // Assert
      expect(shell.node.config.editor.text).toBe(QUICK_START.config);
    });

    it("should describe it in the inspector", () => {
      // Arrange
      const { shell } = renderShell();

      // Act
      shell.project.click(CONFIG);

      // Assert
      expect(shell.inspector.config.groupLabels).toContain("Element types");
    });

    it("should add its tab to the problems and select it", () => {
      // Arrange
      const { shell } = renderShell();

      // Act
      shell.project.click(CONFIG);

      // Assert
      expect(getTabs(shell)).toEqual(["Sketch", "eslint.config.js*"]);
      expect(shell.problems.list.emptyText).toBe("No problems in the config.");
    });

    it("should let the editor change the text when the config can be edited", () => {
      // Arrange
      const { shell } = renderShell();

      // Act
      shell.project.click(CONFIG);

      // Assert
      expect(shell.node.config.editor.isReadOnly).toBe(false);
    });

    it("should read the text only, when the config cannot be edited", () => {
      // Arrange
      const { shell } = renderShell({ capabilities: READ_ONLY });

      // Act
      shell.project.click(CONFIG);

      // Assert
      expect(shell.node.config.editor.isReadOnly).toBe(true);
    });

    it("should report the sketch that an edit makes, with the same tree", () => {
      // Arrange
      const { shell, onSketchChange } = renderShell();
      shell.project.click(CONFIG);
      const { editor } = shell.node.config;

      // Act
      editor.replaceText(0, editor.text.length, "{}");

      // Assert
      expect(onSketchChange).toHaveBeenCalledTimes(1);

      const [sketch] = onSketchChange.mock.calls[0];

      expect(sketch.config).toBe("{}");
      expect(sketch.tree).toBe(QUICK_START.tree);
    });

    it("should show the problems of an edit a moment after it", () => {
      // Arrange
      useFakeTimeouts();
      const { shell } = renderShell();
      shell.project.click(CONFIG);
      const at = QUICK_START.config.indexOf('"disallow"');

      // Act
      shell.node.config.editor.replaceText(
        at,
        at + '"disallow"'.length,
        '"dissallow"'
      );
      const before = getStatus(shell);
      wait(EVALUATION_WAIT);

      // Assert
      expect(before).toBe("6 files · 0 dependencies · 0 problems");
      expect(getStatus(shell)).toBe(
        "6 files · 0 dependencies · config has errors"
      );
      expect(getTabs(shell)).toEqual(["Sketch1", "eslint.config.js1*"]);
    });
  });

  describe("the problems of the config", () => {
    it("should wait for the last keystroke before the config is evaluated", () => {
      // Arrange
      useFakeTimeouts();
      const { shell } = renderShell();
      shell.project.click(CONFIG);
      const { editor } = shell.node.config;
      const at = QUICK_START.config.indexOf('"disallow"');

      // Act
      editor.typeAt(at + 1, "x");
      wait(EVALUATION_WAIT - 50);
      editor.typeAt(at + 2, "y");
      wait(EVALUATION_WAIT - 1);
      const beforeTheLastDelay = getStatus(shell);
      wait(1);

      // Assert
      expect(beforeTheLastDelay).toBe("6 files · 0 dependencies · 0 problems");
      expect(getStatus(shell)).toBe(
        "6 files · 0 dependencies · config has errors"
      );
    });

    it("should list them in the sketch tab with their count", () => {
      // Act
      const { shell } = renderShell({ initialSketch: MISTAKES });

      // Assert
      expect(getTabs(shell)).toEqual(["Sketch2*"]);
      expect(
        getProblemRow(shell, "eslint.config.js:15:16").locationWithPosition
      ).toBe("eslint.config.js:15:16");
      expect(
        getProblemRow(shell, "eslint.config.js:5:7").locationWithPosition
      ).toBe("eslint.config.js:5:7");
    });

    it("should show the warning about the additional dependency nodes as any other warning: counted, listed and underlined at the setting", () => {
      // Arrange
      const { shell } = renderShell({ initialSketch: WITH_ADDITIONAL_NODES });

      // Act
      const row = getProblemRow(shell, "eslint.config.js:8:47");
      row.press();

      // Assert
      expect(getStatus(shell)).toBe("6 files · 0 dependencies · 1 problem");
      expect(row.message).toBe(
        'The playground does not run the selectors of "boundaries/additional-dependency-nodes". A statement that only one of them reads is not checked as ESLint checks it: the playground reads a statement only through the built-in selectors of "boundaries/dependency-nodes".'
      );
      expect(row.meta).toBe(
        "warning · settings › boundaries/additional-dependency-nodes"
      );
      expect(shell.node.config.editor.underlinedText("warning")).toBe(
        ADDITIONAL_NODES
      );
      expect(shell.node.config.editor.underlinedText("error")).toBeNull();
    });

    it("should say that the rules are not evaluated while their options are invalid", () => {
      // Act
      const { shell } = renderShell({ initialSketch: MISTAKES });

      // Assert
      expect(shell.problems.note.note.role).toBe("note");
      expect(shell.problems.note.text).toBe(NOTE_TEXT);
    });

    it("should not say it when the options of the rules are valid, even if the config has a warning", () => {
      // Act
      const { shell } = renderShell({ initialSketch: WARNING_ONLY });

      // Assert
      expect(shell.problems.panel.isRegionNamed("Problems")).toBe(true);
      expect(shell.problems.note.isRendered).toBe(false);
    });

    it("should not say it for a config without problems", () => {
      // Act
      const { shell } = renderShell();

      // Assert
      expect(shell.problems.panel.isRegionNamed("Problems")).toBe(true);
      expect(shell.problems.note.isRendered).toBe(false);
    });

    it("should open the editor at the range of a problem when its row is pressed", () => {
      // Arrange
      const { shell } = renderShell({ initialSketch: MISTAKES });

      // Act
      getProblemRow(shell, "eslint.config.js:15:16").press();

      // Assert
      expect(shell.node.config.editor.cursor).toBe(
        MISTAKES.config.indexOf('"dissallow"')
      );
      expect(shell.node.config.editorNamed(CONFIG).isRendered).toBe(true);
    });

    it("should select the tab of the config and keep the problems and the note in it", () => {
      // Arrange
      const { shell } = renderShell({ initialSketch: MISTAKES });

      // Act
      getProblemRow(shell, "eslint.config.js:5:7").press();

      // Assert
      expect(getTabs(shell)).toEqual(["Sketch2", "eslint.config.js2*"]);
      expect(shell.problems.note.isRendered).toBe(true);
      expect(
        getProblemRow(shell, "eslint.config.js:15:16").locationWithPosition
      ).toBe("eslint.config.js:15:16");
    });

    it("should open the config from a file that was open", () => {
      // Arrange
      const { shell } = renderShell({ initialSketch: MISTAKES });
      shell.project.click(FILE);
      shell.problems.tab(/Sketch/).select();

      // Act
      getProblemRow(shell, "eslint.config.js:5:7").press();

      // Assert
      expect(shell.node.config.editor.cursor).toBe(
        MISTAKES.config.indexOf('{ type: "component"')
      );
      expect(shell.node.frame.holds(FILE)).toBe(false);
    });

    it("should scroll to the range again when the same problem is pressed after the user moved away", () => {
      // Arrange
      const { shell } = renderShell({ initialSketch: MISTAKES });
      getProblemRow(shell, "eslint.config.js:15:16").press();
      shell.node.config.editor.moveCursor(0);

      // Act
      shell.problems.tab(/Sketch/).select();
      getProblemRow(shell, "eslint.config.js:15:16").press();

      // Assert
      expect(shell.node.config.editor.cursor).toBe(
        MISTAKES.config.indexOf('"dissallow"')
      );
    });

    it("should not scroll the editor to an old range when the config is opened again, and leave the cursor where the user put it", () => {
      // Arrange
      const { shell } = renderShell({ initialSketch: MISTAKES });
      getProblemRow(shell, "eslint.config.js:15:16").press();
      shell.node.config.editor.moveCursor(3);
      shell.project.click(FILE);

      // Act
      shell.project.click(CONFIG);

      // Assert
      expect(shell.node.config.editor.cursor).toBe(3);
    });

    it("should open the config at the range of a problem that is pressed while the config is open", () => {
      // Arrange
      const { shell } = renderShell({ initialSketch: MISTAKES });
      shell.project.click(CONFIG);
      shell.node.config.editor.moveCursor(0);

      // Act
      getProblemRow(shell, "eslint.config.js:15:16").press();

      // Assert
      expect(shell.node.config.editor.cursor).toBe(
        MISTAKES.config.indexOf('"dissallow"')
      );
    });

    it("should keep the undo history of the config when a file is opened and the config comes back", () => {
      // Arrange
      const { shell, onSketchChange } = renderShell();
      shell.project.click(CONFIG);
      shell.node.config.editor.typeAt(0, "// note\n");
      shell.project.click(FILE);
      shell.project.click(CONFIG);
      const { editor } = shell.node.config;

      // Act
      const undone = editor.undo();

      // Assert
      expect(undone).toBe(true);
      expect(editor.text).toBe(QUICK_START.config);
      expect(onSketchChange.mock.lastCall?.[0].config).toBe(QUICK_START.config);
    });

    it("should keep the text that the user typed when a file is opened and the config comes back", () => {
      // Arrange
      const { shell } = renderShell();
      shell.project.click(CONFIG);
      shell.node.config.editor.typeAt(0, "// note\n");
      shell.project.click(FILE);

      // Act
      shell.project.click(CONFIG);

      // Assert
      expect(shell.node.config.editor.text).toBe(
        `// note\n${QUICK_START.config}`
      );
    });

    it("should report the edits of the editor that opens again, and only once", () => {
      // Arrange
      const { shell, onSketchChange } = renderShell();
      shell.project.click(CONFIG);
      shell.project.click(FILE);
      shell.project.click(CONFIG);

      // Act
      shell.node.config.editor.typeAt(0, " ");

      // Assert
      expect(onSketchChange).toHaveBeenCalledTimes(1);
      expect(onSketchChange.mock.calls[0][0].config).toBe(
        ` ${QUICK_START.config}`
      );
    });

    it("should open the config at an entry that the inspector points at", () => {
      // Arrange
      const { shell } = renderShell({ initialSketch: MISTAKES });
      shell.project.click(CONFIG);
      const [ignored] = evaluate(MISTAKES).elementTypes.filter(
        ({ ignored: isIgnored }) => isIgnored
      );

      // Act
      shell.inspector.config.row(/component/).press();

      // Assert
      expect(shell.node.config.editor.cursor).toBe(ignored.range.from);
    });

    it("should open the config at an entry that the inspector points at when a file was open", () => {
      // Arrange
      const { shell } = renderShell({ initialSketch: MISTAKES });
      shell.project.click(CONFIG);
      const [ignored] = evaluate(MISTAKES).elementTypes.filter(
        ({ ignored: isIgnored }) => isIgnored
      );
      shell.project.click(FILE);
      shell.project.click(CONFIG);
      shell.node.config.editor.moveCursor(0);

      // Act
      shell.inspector.config.row(/component/).press();

      // Assert
      expect(shell.node.config.editor.cursor).toBe(ignored.range.from);
    });
  });

  describe("text mode", () => {
    it("should show the project as a path per line, with the config first", () => {
      // Arrange
      const { shell } = renderShell();

      // Act
      shell.project.foot.pressView("Text");

      // Assert
      const lines = shell.project.text.value.split("\n");

      expect(shell.project.text.area.isTextboxNamed("Project as text")).toBe(
        true
      );
      expect(lines[0]).toBe("eslint.config.js");
      expect(lines).toContain(FILE);
    });

    it("should read the lines the user types into the sketch, and show them in the tree", () => {
      // Arrange
      useFakeTimeouts();
      const { shell, onSketchChange } = renderShell();
      shell.project.foot.pressView("Text");

      // Act
      shell.project.text.type(`${shell.project.text.value}\nsrc/extra.js`);
      wait(TEXT_READ_WAIT);
      shell.project.foot.pressView("Tree");

      // Assert
      expect(shell.project.item("src/extra.js").isRendered).toBe(true);
      expect(getStatus(shell)).toBe("7 files · 0 dependencies · 0 problems");
      expect(
        getPaths(onSketchChange.mock.calls.at(-1)?.[0] as Sketch)
      ).toContain("src/extra.js");
    });

    it("should keep the lines that could not be read in the sketch tab, with their count", () => {
      // Arrange
      const { shell } = renderShell();
      shell.project.foot.pressView("Text");
      const { text } = shell.project;

      // Act
      text.type(`${text.value}\nsrc/../outside.js`);
      text.blur();

      // Assert
      expect(getTabs(shell)).toEqual(["Sketch1*"]);
      expect(getStatus(shell)).toBe("6 files · 0 dependencies · 1 problem");
      expect(getProblemItem(shell, "Project text:9").text).toContain(
        "The path cannot have `.` or `..` segments."
      );
    });

    it("should list a line that could not be read as plain content, and not as a button", () => {
      // Arrange
      const { shell } = renderShell({ initialSketch: MISTAKES });
      shell.project.foot.pressView("Text");

      // Act
      shell.project.text.type(`${shell.project.text.value}\nsrc/../outside.js`);
      shell.project.text.blur();

      // Assert
      const unreadable = getProblemItem(shell, "Project text:9");

      expect(unreadable.opens).toBe(false);
      expect(unreadable.tagName).toBe("LI");
      // The rows of the config are still buttons
      expect(
        getProblemRow(shell, "eslint.config.js:15:16").locationWithPosition
      ).toBe("eslint.config.js:15:16");
    });

    it("should open nothing when a line that could not be read is pressed", () => {
      // Arrange
      const { shell } = renderShell();
      shell.project.foot.pressView("Text");
      shell.project.text.type(`${shell.project.text.value}\nsrc/../outside.js`);
      shell.project.text.blur();

      // Act
      getProblemItem(shell, "Project text:9").press();

      // Assert
      expect(shell.node.shown).toBe("empty");
      expect(shell.node.empty.title).toBe("Open a file or the config");
      expect(getTabs(shell)).toEqual(["Sketch1*"]);
    });

    it("should drop the lines that could not be read when the tree comes back", () => {
      // Arrange
      const { shell } = renderShell();
      shell.project.foot.pressView("Text");
      shell.project.text.type(`${shell.project.text.value}\nsrc/../outside.js`);
      shell.project.text.blur();

      // Act
      shell.project.foot.pressView("Tree");

      // Assert
      expect(getTabs(shell)).toEqual(["Sketch*"]);
      expect(getStatus(shell)).toBe("6 files · 0 dependencies · 0 problems");
    });

    it("should leave nothing in focus when the file in focus is no longer in the text", () => {
      // Arrange
      const { shell } = renderShell();
      shell.project.click(FILE);
      shell.project.foot.pressView("Text");
      const { text } = shell.project;

      // Act
      const lines = text.value.split("\n");
      const fileLine = lines.indexOf(FILE);
      // The file goes with its dependencies, the indented lines below it
      const dependencyLines = lines
        .slice(fileLine + 1)
        .findIndex((line) => !line.startsWith("  "));

      text.type(
        [
          ...lines.slice(0, fileLine),
          ...lines.slice(fileLine + 1 + dependencyLines),
        ].join("\n")
      );
      text.blur();

      // Assert
      expect(shell.node.shown).toBe("empty");
      expect(shell.node.empty.title).toBe("Open a file or the config");
      expect(getTabs(shell)).toEqual(["Sketch*"]);
    });

    it("should keep the dependency in focus on its line when another line is turned into what it says", () => {
      // Arrange
      useFakeTimeouts();
      const shell = renderExample();
      shell.project.click(BUTTON);
      shell.node.file.lines.line(1).click();
      shell.project.foot.pressView("Text");
      const { text } = shell.project;
      const formatLine =
        '  import { format } from "../../../helpers/format/index.js";';
      // A side-effect import names nothing, so a file can have the same one twice
      const styleLine = '  import "./Button.css";';
      const lines = text.value.split("\n");
      // The first dependency of the open file is its first line below it
      const firstLine = lines.indexOf(BUTTON) + 1;

      // Act
      expect(lines[firstLine]).toBe(formatLine);

      lines[firstLine] = styleLine;
      text.type(lines.join("\n"));
      wait(TEXT_READ_WAIT);

      // Assert
      expect(shell.problems.tabs.at(-1)?.text).toBe("line 2");
      expect(shell.problems.tabs.at(-1)?.isSelected).toBe(true);
      expect(shell.node.file.lines.line(1).isSelected).toBe(true);
      expect(shell.node.file.lines.line(0).isSelected).toBe(false);
    });

    it("should keep the file in focus when the text still has it", () => {
      // Arrange
      const { shell } = renderShell();
      shell.project.click(FILE);
      shell.project.foot.pressView("Text");
      const { text } = shell.project;

      // Act
      text.type(`${text.value}\nsrc/extra.js`);
      text.blur();

      // Assert
      expect(shell.node.file.head.path).toBe(FILE);
      expect(getTabs(shell)).toEqual(["Sketch", "checkout/index.js*"]);
    });
  });

  describe("focus", () => {
    it("should follow a file that is renamed", () => {
      // Arrange
      const { shell } = renderShell();
      shell.project.click("src/index.js");

      // Act
      shell.project.rename("src/index.js", "main.js");

      // Assert
      expect(shell.node.file.head.path).toBe("src/main.js");
      expect(getTabs(shell)).toEqual(["Sketch", "src/main.js*"]);
    });

    it("should follow a folder that holds the file and is renamed", () => {
      // Arrange
      const { shell } = renderShell();
      shell.project.click(FILE);

      // Act
      shell.project.rename("src/modules", "features");

      // Assert
      expect(shell.node.file.head.path).toBe("src/features/checkout/index.js");
      expect(getTabs(shell)).toEqual(["Sketch", "checkout/index.js*"]);
    });

    it("should describe the renamed file in the inspector at once, without lagging behind the rename", () => {
      // Arrange
      useFakeTimeouts();
      const { shell } = renderShell();
      shell.project.click(FILE);

      // Act
      shell.project.rename("src/modules", "features");

      // Assert
      const { file } = shell.inspector;

      expect(file.title("src/features/checkout/index.js").isRendered).toBe(
        true
      );
      expect(file.facet("element").isRendered).toBe(true);
    });

    it("should show the status of the renamed project at once", () => {
      // Arrange
      useFakeTimeouts();
      const { shell } = renderShell();
      shell.project.click(FILE);

      // Act
      shell.project.rename("src/modules", "features");

      // Assert
      expect(getStatus(shell)).toBe("6 files · 0 dependencies · 0 problems");
    });

    it("should keep the tab of the sketch when the file in focus is renamed while that tab is selected", () => {
      // Arrange
      const { shell } = renderShell();
      shell.project.click(FILE);
      shell.problems.tab(/Sketch/).select();

      // Act
      shell.project.rename("src/modules", "features");

      // Assert
      expect(getTabs(shell)).toEqual(["Sketch*", "checkout/index.js"]);
      expect(shell.node.file.head.path).toBe("src/features/checkout/index.js");
    });

    it("should keep the tab of the file when the file in focus is renamed while that tab is selected", () => {
      // Arrange
      const { shell } = renderShell();
      shell.project.click("src/index.js");

      // Act
      shell.project.rename("src/index.js", "main.js");

      // Assert
      expect(getTabs(shell)).toEqual(["Sketch", "src/main.js*"]);
    });

    it("should leave nothing in focus when the file in focus is removed", () => {
      // Arrange
      const { shell } = renderShell();
      shell.project.click(FILE);

      // Act
      shell.project.item(FILE).deleteAction.press();

      // Assert
      expect(shell.node.shown).toBe("empty");
      expect(shell.node.empty.title).toBe("Open a file or the config");
      expect(getTabs(shell)).toEqual(["Sketch*"]);
    });

    it("should leave nothing in focus when a folder that holds the file in focus is removed", async () => {
      // Arrange
      const { shell } = renderShell();
      shell.project.click(FILE);

      // Act
      shell.project.item("src/modules").deleteAction.press();
      shell.project.deleteDialog.confirm();
      await shell.project.waitUntilDeleteDialogGone();

      // Assert
      expect(shell.node.shown).toBe("empty");
      expect(shell.node.empty.title).toBe("Open a file or the config");
    });

    it("should keep the file in focus when another file is removed", () => {
      // Arrange
      const { shell } = renderShell();
      shell.project.click(FILE);

      // Act
      shell.project.item("src/index.js").deleteAction.press();

      // Assert
      expect(shell.node.file.head.path).toBe(FILE);
    });

    it("should describe the sketch in the inspector at once after a file is removed", () => {
      // Arrange
      useFakeTimeouts();
      const { shell } = renderShell();

      // Act
      shell.project.item(FILE).deleteAction.press();

      // Assert
      expect(shell.inspector.project.count("files")).toBe("5");
    });
  });

  describe("the dependencies of the example", () => {
    it("should list the dependencies of the file that is opened, with the verdict of each one", () => {
      // Arrange
      const shell = renderExample();

      // Act
      shell.project.click(FILE);

      // Assert
      expect(shell.node.file.lines.lineTexts).toEqual([
        '1import { Button } from "../../components/atoms/Button/index.js";policy 1',
        '2import { format } from "../../helpers/format/index.js";policy 1',
        '3import { renderButton } from "../../components/atoms/Button/Button.spec.js";policy 2',
        '4import React from "react";not checked · external',
      ]);
    });

    it("should list the failing dependency of the file in the tab of the file", () => {
      // Arrange
      const shell = renderExample();

      // Act
      shell.project.click(FILE);

      // Assert
      expect(getTabs(shell)).toEqual(["Sketch2", "checkout/index.js1*"]);
      expect(shell.problems.list.rows.map((row) => row.message)).toEqual([
        'Dependencies to file of category "test" are not allowed. Denied by policy at index 2',
      ]);
    });

    describe("a line that is clicked", () => {
      it("should be selected, with the tab of the dependency", () => {
        // Arrange
        const shell = renderExample();
        shell.project.click(FILE);

        // Act
        shell.node.file.lines.line(2).click();

        // Assert
        expect(shell.node.file.lines.line(2).isSelected).toBe(true);
        expect(getTabs(shell)).toEqual([
          "Sketch2",
          "checkout/index.js1",
          "line 3*",
        ]);
        expect(shell.problems.detail.verdictText).toBe("disallowed · policy 2");
      });

      it("should outline the node it points to in the tree, and only that one", () => {
        // Arrange
        const shell = renderExample();
        shell.project.click(FILE);

        // Act
        shell.node.file.lines.line(2).click();

        // Assert
        const { itemPaths } = shell.project.tree;

        expect(
          itemPaths.filter((path) => shell.project.item(path).row.isTarget)
        ).toEqual([BUTTON_SPEC]);
        expect(shell.project.item(BUTTON_SPEC).row.targetTag).toBe("target");
      });

      it("should keep the file in the inspector, selected in the tree and open in the pane", () => {
        // Arrange
        const shell = renderExample();
        shell.project.click(FILE);

        // Act
        shell.node.file.lines.line(2).click();

        // Assert
        expect(shell.inspector.file.title(FILE).isRendered).toBe(true);
        expect(shell.inspector.file.summary.total).toBe("4 dependencies");
        expect(shell.project.tree.selectedPaths).toEqual([FILE]);
        expect(shell.node.file.head.path).toBe(FILE);
      });

      it("should outline nothing when the dependency is on an external module", () => {
        // Arrange
        const shell = renderExample();
        shell.project.click(FILE);

        // Act
        shell.node.file.lines.line(3).click();

        // Assert
        const { itemPaths } = shell.project.tree;

        expect(
          itemPaths.filter((path) => shell.project.item(path).row.isTarget)
        ).toEqual([]);
      });
    });

    describe("a dependency added with the picker", () => {
      it("should be the fifth line, with the verdict of the policy that allows it", async () => {
        // Arrange
        const shell = renderExample();
        shell.project.click(FILE);

        // Act
        await addDependencyOf(shell, OTHER_FILE, "round");

        // Assert
        expect(shell.node.file.lines.lineTexts[4]).toBe(
          '5import { round } from "../../helpers/format/index.js";policy 1'
        );
      });

      it("should hold the name that was typed and not confirmed when the user adds it", async () => {
        // Arrange
        const shell = renderExample();
        shell.project.click(FILE);

        // Act
        await addDependencyOf(shell, OTHER_FILE, "round", {
          confirmName: false,
        });

        // Assert
        expect(shell.node.file.lines.lineTexts[4]).toBe(
          '5import { round } from "../../helpers/format/index.js";policy 1'
        );
      });

      it("should count one dependency more in the top bar, and the same problems", async () => {
        // Arrange
        const shell = renderExample();
        shell.project.click(FILE);

        // Act
        await addDependencyOf(shell, OTHER_FILE, "round");

        // Assert
        expect(getStatus(shell)).toBe("6 files · 10 dependencies · 2 problems");
        expect(getTabs(shell)).toEqual([
          "Sketch2",
          "checkout/index.js1",
          "line 5*",
        ]);
      });

      it("should count one problem more, in the top bar, the file tab and the tree, when the policies disallow it", async () => {
        // Arrange
        const shell = renderExample();
        shell.project.click(FILE);

        // Act
        await addDependencyOf(shell, BUTTON_SPEC, "ButtonSpec");

        // Assert
        expect(shell.node.file.lines.lineTexts[4]).toBe(
          '5import { ButtonSpec } from "../../components/atoms/Button/Button.spec.js";policy 2'
        );
        expect(getStatus(shell)).toBe("6 files · 10 dependencies · 3 problems");
        expect(getTabs(shell)).toEqual([
          "Sketch3",
          "checkout/index.js2",
          "line 5*",
        ]);
        expect(
          shell.project.item(FILE).row.badge("2 failing dependencies").count
        ).toBe("2");
      });

      it("should be reported with the sketch", async () => {
        // Arrange
        const onSketchChange = jest.fn();
        const shell = renderExample({ onSketchChange });
        shell.project.click(FILE);

        // Act
        await addDependencyOf(shell, OTHER_FILE, "round");

        // Assert
        const [sketch] = onSketchChange.mock.calls[0] as [Sketch];

        expect(sketch.dependencies).toHaveLength(10);
        expect(sketch.dependencies[9]).toEqual({
          from: FILE,
          target: { kind: "node", path: OTHER_FILE },
          syntax: "import",
          importKind: "value",
          specifiers: [{ kind: "named", name: "round" }],
        });
      });
    });

    describe("a dependency edited to an external module", () => {
      it("should read as not checked, and stop failing when it did", async () => {
        // Arrange
        const shell = renderExample();
        shell.project.click(FILE);
        shell.node.file.lines.line(2).editAction.press();
        const { picker } = shell.node.file;

        // Act
        picker.target.select("An external module");
        picker.typeModule("lodash");
        picker.confirm();
        await picker.waitUntilGone();

        // Assert
        expect(shell.node.file.lines.lineTexts[2]).toBe(
          '3import { renderButton } from "lodash";not checked · external'
        );
        expect(getStatus(shell)).toBe("6 files · 9 dependencies · 1 problem");
        expect(getTabs(shell)).toEqual(["Sketch1", "checkout/index.js*"]);
        expect(shell.project.item(FILE).row.badgeNames).toEqual([]);
      });
    });

    describe("a failing dependency removed", () => {
      it("should take its line, the badges of the tree and its problem away", () => {
        // Arrange
        const shell = renderExample();
        shell.project.click(FILE);

        // Act
        shell.node.file.lines.line(2).deleteAction.press();

        // Assert
        expect(shell.node.file.lines.lineTexts).toEqual([
          '1import { Button } from "../../components/atoms/Button/index.js";policy 1',
          '2import { format } from "../../helpers/format/index.js";policy 1',
          '3import React from "react";not checked · external',
        ]);
        expect(
          [FILE, "src/modules", "src"].map(
            (path) => shell.project.item(path).row.badgeNames
          )
        ).toEqual([[], [], ["1 failing dependency"]]);
        expect(getStatus(shell)).toBe("6 files · 8 dependencies · 1 problem");
        expect(getTabs(shell)).toEqual(["Sketch1", "checkout/index.js*"]);
        expect(shell.problems.list.emptyText).toBe("No problems in this file.");
      });

      it("should leave the dependency tab when the line in focus is removed", () => {
        // Arrange
        const shell = renderExample();
        shell.project.click(FILE);
        shell.node.file.lines.line(2).click();

        // Act
        shell.node.file.lines.line(2).deleteAction.press();

        // Assert
        expect(getTabs(shell)).toEqual(["Sketch1", "checkout/index.js*"]);
        expect(shell.node.file.head.path).toBe(FILE);
      });
    });

    describe("open policy in config", () => {
      it("should open the config with the lines of the policy highlighted", () => {
        // Arrange
        const shell = renderExample();
        shell.project.click(FILE);
        shell.node.file.lines.line(2).click();

        // Act
        shell.problems.detail.openPolicy();

        // Assert
        expect(shell.node.shown).toBe("config");
        expect(shell.node.config.editor.highlightedLineTexts).toEqual([
          "        {",
          "          // No element may import a test file, whatever element it belongs to",
          '          disallow: { to: { file: { categories: "test" } } },',
          "        },",
        ]);
        expect(shell.node.config.editor.cursor).toBe(
          EXAMPLE.config.indexOf("{\n          // No element may import")
        );
      });

      it("should say in the tab of the config which policy is highlighted, and where it came from", () => {
        // Arrange
        const shell = renderExample();
        shell.project.click(FILE);
        shell.node.file.lines.line(2).click();

        // Act
        shell.problems.detail.openPolicy();

        // Assert
        expect(getTabs(shell)).toEqual(["Sketch2", "eslint.config.js*"]);
        expect(shell.problems.note.text).toBe(
          "No problems in the config. Policy 2 is highlighted, opened from the dependency at line 3 of src/modules/checkout/index.js."
        );
      });

      it("should name the policy by its new number, with the same lines marked, when a policy is put before it in the editor", () => {
        // Arrange
        useFakeTimeouts();
        const shell = renderExample();
        shell.project.click(FILE);
        shell.node.file.lines.line(2).click();
        shell.problems.detail.openPolicy();
        const { editor } = shell.node.config;
        const marked = editor.highlightedLineTexts;
        const policyAt = EXAMPLE.config.indexOf(
          "        {\n          // No element may import"
        );

        // Act
        editor.typeAt(
          policyAt,
          [
            "        {",
            '          from: { element: { type: "helper" } },',
            '          allow: { to: { element: { type: "helper" } } },',
            "        },",
            "",
          ].join("\n")
        );
        const noteWhileBehind = shell.problems.note.text;
        wait(EVALUATION_WAIT);

        // Assert
        expect(noteWhileBehind).toBe(
          "No problems in the config. Policy 2 is highlighted, opened from the dependency at line 3 of src/modules/checkout/index.js."
        );
        expect(shell.problems.note.text).toBe(
          "No problems in the config. Policy 3 is highlighted, opened from the dependency at line 3 of src/modules/checkout/index.js."
        );
        expect(editor.highlightedLineTexts).toEqual(marked);
      });

      it("should leave the number out while the evaluation has no policy that starts where the highlight is, and name it again when it has", () => {
        // Arrange
        useFakeTimeouts();
        const shell = renderExample();
        shell.project.click(FILE);
        shell.node.file.lines.line(2).click();
        shell.problems.detail.openPolicy();
        const { editor } = shell.node.config;
        const severityAt =
          EXAMPLE.config.indexOf('"boundaries/dependencies": [2,') +
          '"boundaries/dependencies": ['.length;

        // Act
        // With the rule off the evaluation has no policies at all
        editor.replaceText(severityAt, severityAt + 1, "0");
        wait(EVALUATION_WAIT);
        const notesWhileOff = shell.problems.notes.map(({ text }) => text);
        editor.replaceText(severityAt, severityAt + 1, "2");
        wait(EVALUATION_WAIT);

        // Assert
        expect(notesWhileOff).toEqual([
          "Dependencies are not evaluated while the rule is off: ESLint does not run a rule whose severity is off.",
          "No problems in the config. A policy is highlighted, opened from the dependency at line 3 of src/modules/checkout/index.js.",
        ]);
        expect(shell.problems.note.text).toBe(
          "No problems in the config. Policy 2 is highlighted, opened from the dependency at line 3 of src/modules/checkout/index.js."
        );
      });

      it("should drop the note and the lines when the policy is deleted in the editor", () => {
        // Arrange
        useFakeTimeouts();
        const shell = renderExample();
        shell.project.click(FILE);
        shell.node.file.lines.line(2).click();
        shell.problems.detail.openPolicy();
        const { editor } = shell.node.config;
        const policyAt = EXAMPLE.config.indexOf(
          "        {\n          // No element may import"
        );
        const policyEnd = EXAMPLE.config.indexOf("        },\n", policyAt) + 11;

        // Act
        editor.replaceText(policyAt, policyEnd, "");
        wait(EVALUATION_WAIT);

        // Assert
        expect(editor.highlightedLines).toEqual([]);
        expect(shell.problems.note.isRendered).toBe(false);
      });

      it("should drop the highlight when a file is opened", () => {
        // Arrange
        const shell = renderExample();
        shell.project.click(FILE);
        shell.node.file.lines.line(2).click();
        shell.problems.detail.openPolicy();

        // Act
        shell.project.click(FILE);
        shell.project.click(CONFIG);

        // Assert
        expect(shell.node.config.editor.highlightedLines).toEqual([]);
        expect(shell.problems.note.isRendered).toBe(false);
        expect(shell.problems.list.emptyText).toBe(
          "No problems in the config."
        );
      });
    });

    describe("when the dependencies cannot be edited", () => {
      it("should list the dependencies, and offer neither to add, to edit nor to remove one", () => {
        // Arrange
        const shell = renderExample({ capabilities: READ_ONLY });

        // Act
        shell.project.click(FILE);

        // Assert
        expect(shell.node.file.lines.lineTexts).toHaveLength(4);
        expect(shell.node.file.addButton.isRendered).toBe(false);
        expect(
          shell.node.file.lines.lines.map(({ actionNames }) => actionNames)
        ).toEqual([[], [], [], []]);
      });

      it("should still put a dependency in focus when its line is clicked", () => {
        // Arrange
        const shell = renderExample({ capabilities: READ_ONLY });
        shell.project.click(FILE);

        // Act
        shell.node.file.lines.line(2).click();

        // Assert
        expect(getTabs(shell)).toEqual([
          "Sketch2",
          "checkout/index.js1",
          "line 3*",
        ]);
      });
    });

    describe("the failing dependency of the home", () => {
      it("should read default in the bad tone, with the message of the plugin in the problems", () => {
        // Arrange
        const shell = renderExample();

        // Act
        shell.project.click(OTHER_FILE);

        // Assert
        const [line] = shell.node.file.lines.lines;
        const [problem] = shell.problems.list.rows;

        expect({
          statement: line.statementText,
          verdict: line.verdict.text,
          color: line.verdict.color,
        }).toEqual({
          statement:
            'import { Button } from "../../components/atoms/Button/index.js";',
          verdict: "default",
          color: "var(--jsb-code-error)",
        });
        expect({ message: problem.message, meta: problem.meta }).toEqual({
          message:
            'There is no policy allowing dependencies from elements of type "helper" to elements of type "component"',
          meta: "disallowed · default",
        });
        expect(getStatus(shell)).toBe("6 files · 9 dependencies · 2 problems");
      });

      it("should open the dependency from its row in the problems", () => {
        // Arrange
        const shell = renderExample();
        shell.project.click(OTHER_FILE);

        // Act
        shell.problems.list.rows[0].press();

        // Assert
        expect(shell.node.file.lines.line(0).isSelected).toBe(true);
        expect(shell.problems.detail.verdictText).toBe("disallowed · default");
        expect(shell.problems.detail.message).toBe(
          'There is no policy allowing dependencies from elements of type "helper" to elements of type "component"'
        );
        expect(shell.project.item(BUTTON).row.targetTag).toBe("target");
      });
    });
  });

  describe("tabs", () => {
    it("should select the tab of the node when it is opened, and the sketch's when nothing is", () => {
      // Arrange
      const { shell } = renderShell();

      // Act
      shell.project.click(FILE);
      const opened = getTabs(shell);
      shell.project.item(FILE).deleteAction.press();

      // Assert
      expect(opened).toEqual(["Sketch", "checkout/index.js*"]);
      expect(getTabs(shell)).toEqual(["Sketch*"]);
    });

    it("should show the body of the tab that the user selects", () => {
      // Arrange
      const { shell } = renderShell({ initialSketch: MISTAKES });
      shell.project.click(FILE);

      // Act
      shell.problems.tab(/Sketch/).select();

      // Assert
      expect(getTabs(shell)).toEqual(["Sketch2*", "checkout/index.js"]);
      expect(
        getProblemRow(shell, "eslint.config.js:5:7").locationWithPosition
      ).toBe("eslint.config.js:5:7");
      expect(shell.problems.panel.holds("No problems in this file.")).toBe(
        false
      );
    });

    it("should go back to the tab of the node when the user selects it", () => {
      // Arrange
      const { shell } = renderShell();
      shell.project.click(FILE);
      shell.problems.tab(/Sketch/).select();

      // Act
      shell.problems.tab("checkout/index.js").select();

      // Assert
      expect(getTabs(shell)).toEqual(["Sketch", "checkout/index.js*"]);
      expect(shell.problems.list.emptyText).toBe("No problems in this file.");
    });

    it("should select the tab of the node again when another node is opened", () => {
      // Arrange
      const { shell } = renderShell();
      shell.project.click(FILE);
      shell.problems.tab(/Sketch/).select();

      // Act
      shell.project.click(OTHER_FILE);

      // Assert
      expect(getTabs(shell)).toEqual(["Sketch", "format/index.js*"]);
    });

    it("should switch between the tab of a file and the one of the config", () => {
      // Arrange
      const { shell } = renderShell();
      shell.project.click(FILE);

      // Act
      shell.project.click(CONFIG);

      // Assert
      expect(getTabs(shell)).toEqual(["Sketch", "eslint.config.js*"]);
    });
  });

  describe("collapsing the problems", () => {
    it("should show only the head when the user collapses the panel", () => {
      // Arrange
      const { shell } = renderShell();

      // Act
      shell.problems.toggleNamed("Collapse the problems").press();

      // Assert
      expect(shell.problems.tabPanel.isRendered).toBe(false);
      expect(shell.problems.toggleNamed("Expand the problems").isRendered).toBe(
        true
      );
    });

    it("should show the body again when the user expands the panel", () => {
      // Arrange
      const { shell } = renderShell();
      shell.problems.toggleNamed("Collapse the problems").press();

      // Act
      shell.problems.toggleNamed("Expand the problems").press();

      // Assert
      expect(shell.problems.tabPanel.isRendered).toBe(true);
    });

    it("should expand the panel when the selected tab is pressed", () => {
      // Arrange
      const { shell } = renderShell();
      shell.problems.toggleNamed("Collapse the problems").press();

      // Act
      shell.problems.tab(/Sketch/).select();

      // Assert
      expect(shell.problems.tabPanel.isRendered).toBe(true);
    });

    it("should expand the panel and select the tab that is pressed when it is another one", () => {
      // Arrange
      const { shell } = renderShell();
      shell.project.click(FILE);
      shell.problems.toggleNamed("Collapse the problems").press();

      // Act
      shell.problems.tab(/Sketch/).select();

      // Assert
      expect(getTabs(shell)).toEqual(["Sketch*", "checkout/index.js"]);
      expect(shell.problems.tabPanel.isRendered).toBe(true);
    });

    it("should leave the panel collapsed when a file is opened, and select its tab", () => {
      // Arrange
      const { shell } = renderShell();
      shell.problems.toggleNamed("Collapse the problems").press();

      // Act
      shell.project.click(FILE);

      // Assert
      expect(shell.problems.tabPanel.isRendered).toBe(false);
      expect(getTabs(shell)).toEqual(["Sketch", "checkout/index.js*"]);
    });
  });

  describe("saving", () => {
    it("should not report the sketch it started from", () => {
      // Act
      const { onSketchChange } = renderShell();

      // Assert
      expect(onSketchChange).not.toHaveBeenCalled();
    });

    it("should not report what is not an edit of the sketch", () => {
      // Arrange
      const { shell, onSketchChange } = renderShell();

      // Act
      shell.project.click(FILE);
      shell.project.click(CONFIG);
      shell.project.foot.pressView("Text");

      // Assert
      expect(onSketchChange).not.toHaveBeenCalled();
    });

    it("should not report the sketch again when it renders with another callback", () => {
      // Arrange
      const first = jest.fn();
      const second = jest.fn();
      const { shell, rerender } = renderShell({ onSketchChange: first });
      shell.project.item("src/index.js").deleteAction.press();

      // Act
      rerender({ onSketchChange: second });

      // Assert
      expect(first).toHaveBeenCalledTimes(1);
      expect(second).not.toHaveBeenCalled();
    });

    it("should report the next edit to the callback it renders with", () => {
      // Arrange
      const first = jest.fn();
      const second = jest.fn();
      const { shell, rerender } = renderShell({ onSketchChange: first });
      rerender({ onSketchChange: second });

      // Act
      shell.project.item("src/index.js").deleteAction.press();

      // Assert
      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
    });

    it("should report the sketch after an edit of the tree", () => {
      // Arrange
      const { shell, onSketchChange } = renderShell();

      // Act
      shell.project.item("src/index.js").deleteAction.press();

      // Assert
      expect(onSketchChange).toHaveBeenCalledTimes(1);
      expect(getPaths(onSketchChange.mock.calls[0][0])).not.toContain(
        "src/index.js"
      );
    });
  });

  describe("instances", () => {
    it("should not share the edits of its sketch with another shell on the page", () => {
      // Arrange
      const firstSpy = jest.fn();
      const secondSpy = jest.fn();
      const { first, second } = renderShells(
        propsOf({ onSketchChange: firstSpy }),
        propsOf({ onSketchChange: secondSpy })
      );

      // Act
      first.project.item(FILE).deleteAction.press();

      // Assert
      expect([getStatus(first), getStatus(second)]).toEqual([
        "5 files · 0 dependencies · 0 problems",
        "6 files · 0 dependencies · 0 problems",
      ]);
      expect(firstSpy).toHaveBeenCalledTimes(1);
      expect(secondSpy).not.toHaveBeenCalled();
    });

    it("should not share how the project is shown with another shell on the page", () => {
      // Arrange
      const { first, second } = renderShells(propsOf(), propsOf());

      // Act
      first.project.foot.pressView("Text");

      // Assert
      expect(first.project.text.isRendered).toBe(true);
      expect(first.project.tree.isRendered).toBe(false);
      expect(second.project.tree.isRendered).toBe(true);
      expect(second.project.tree.isTreeNamed("Project files")).toBe(true);
    });

    it("should not share the open node or the tabs with another shell", () => {
      // Arrange
      const { first, second } = renderShells(
        propsOf(),
        propsOf({ initialSketch: MISTAKES })
      );

      // Act
      first.project.click(FILE);

      // Assert
      expect(first.problems.tabs.map(({ text }) => text)).toEqual([
        "Sketch",
        "checkout/index.js",
      ]);
      expect(second.problems.tabs.map(({ text }) => text)).toEqual(["Sketch2"]);
      expect(second.node.shown).toBe("empty");
      expect(second.node.empty.title).toBe("Open a file or the config");
    });

    it("should evaluate each shell with its own sketch", () => {
      // Arrange
      useFakeTimeouts();

      // Act
      const { first, second } = renderShells(
        propsOf(),
        propsOf({ initialSketch: MISTAKES })
      );

      // Assert
      expect([getStatus(first), getStatus(second)]).toEqual([
        "6 files · 0 dependencies · 0 problems",
        "6 files · 0 dependencies · config has errors",
      ]);
    });

    it("should ignore a sketch that comes after the first, as the shell owns it from then on", () => {
      // Arrange
      const { shell, rerender } = renderShell();

      // Act
      rerender({ initialSketch: MISTAKES });

      // Assert
      expect(getStatus(shell)).toBe("6 files · 0 dependencies · 0 problems");
    });
  });

  describe("the top bar and the host", () => {
    it("should hand the host the sketch on screen when the user asks to reset it", () => {
      // Arrange
      const onReset = jest.fn();
      const { shell } = renderShell({ onReset });

      shell.project.item("src/index.js").deleteAction.press();

      // Act
      shell.topBar.actions.pressReset();

      // Assert
      expect(onReset).toHaveBeenCalledTimes(1);
      expect(getPaths(onReset.mock.calls[0][0])).not.toContain("src/index.js");
    });

    it("should hand the host the example that the user picks, with the sketch on screen", async () => {
      // Arrange
      const onSelectExample = jest.fn();
      const { shell } = renderShell({ onSelectExample });

      shell.topBar.picker.open();

      // Act
      shell.topBar.picker.pick(EXAMPLES[1].title);
      await shell.topBar.picker.waitUntilClosed();

      // Assert
      expect(onSelectExample).toHaveBeenCalledTimes(1);
      expect(onSelectExample).toHaveBeenCalledWith(EXAMPLES[1], QUICK_START);
    });

    it("should offer Share when the host can make a link", () => {
      // Arrange
      const { shell } = renderShell({
        makeLink: () => Promise.resolve("https://example.com/#v=1&s=abc"),
      });

      // Act
      const { hasShare } = shell.topBar.actions;

      // Assert
      expect(hasShare).toBe(true);
    });

    it("should not offer Share when the host cannot make a link", () => {
      // Arrange
      const { shell } = renderShell();

      // Act
      const { hasShare } = shell.topBar.actions;

      // Assert
      expect(hasShare).toBe(false);
    });

    it("should link the help to the Quick start that the host gives", () => {
      // Arrange
      const { shell } = renderShell({ quickStartUrl: "/docs/quick-start" });

      // Act
      shell.topBar.actions.pressHelp();

      // Assert
      expect(shell.topBar.help.guideLinkHref).toBe("/docs/quick-start");
    });
  });
});
