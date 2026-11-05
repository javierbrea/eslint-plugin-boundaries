import { act } from "@testing-library/react";
import type { ReactNode } from "react";

import type { Sketch } from "@/contract";
import { useTextProblems } from "@/domains/problems/modules/hooks/useTextProblems";
import type { TextProblem } from "@/domains/project/helpers/sketch";
import {
  NO_CAPABILITIES,
  renderInSession,
} from "@/domains/session/data/store/store.mock";
import type { SessionRender } from "@/domains/session/data/store/store.mock";

import { ProjectText } from "./ProjectText";
import { ProjectTextPom } from "./ProjectText.pom";

const SKETCH: Sketch = {
  config: "{ settings: {}, rules: {} }",
  // In the order of the tree: folders first, then files, each by name
  tree: [
    { path: "docs", kind: "folder" },
    { path: "src/components/Button.js", kind: "file" },
    { path: "src/index.js", kind: "file" },
  ],
  dependencies: [
    {
      from: "src/index.js",
      target: { kind: "node", path: "src/components/Button.js" },
      syntax: "import",
      importKind: "value",
      specifiers: [],
    },
  ],
};

/** What {@link renderText} returns: the render of the session, the page object of the text, and what reads the lines that cannot be read. */
type TextRender = SessionRender & {
  /** The page object of the project as text. */
  readonly text: ProjectTextPom;
  /** Lists the lines of text mode that cannot be read, as the problems pane reads them: the line, the text and the reason of each one. */
  readonly getTextProblems: () => string[];
};

/**
 * Renders the text of a sketch in a session, with a probe next to it that holds the lines that cannot be read, as the problems pane reads them.
 * @param sketch The sketch to start from.
 * @param capabilities What the user can change.
 * @returns The render, the store, the spy of the sketches, the page object of the text and what lists the lines that cannot be read.
 */
function renderText(
  sketch: Sketch = SKETCH,
  capabilities?: Parameters<typeof renderInSession>[1]["capabilities"]
): TextRender {
  const reported: { current: readonly TextProblem[] } = { current: [] };

  /**
   * Keeps the lines of text mode that cannot be read, as the latest render of the hook gave them.
   * @returns Nothing to render.
   */
  function TextProblemsProbe(): ReactNode {
    reported.current = useTextProblems();
    return null;
  }

  return {
    ...renderInSession(
      <>
        <ProjectText />
        <TextProblemsProbe />
      </>,
      { sketch, capabilities }
    ),
    text: new ProjectTextPom(),
    getTextProblems: () =>
      reported.current.map(
        ({ line, text, reason }) => `${line}|${text}|${reason}`
      ),
  };
}

/**
 * Lets the delay after the last keystroke go by.
 * @param milliseconds How long.
 */
function wait(milliseconds: number): void {
  act(() => {
    jest.advanceTimersByTime(milliseconds);
  });
}

/**
 * Gets the paths of the tree of the latest sketch a mock received.
 * @param onSketchChange The mock.
 * @returns The path of each node.
 */
function getLastPaths(onSketchChange: jest.Mock): string[] {
  const calls = onSketchChange.mock.calls;
  const sketch = calls[calls.length - 1][0] as Sketch;

  return sketch.tree.map((node) => node.path);
}

describe("ProjectText", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should write the sketch with eslint.config.js first, a path per line and a slash after an empty folder", () => {
    // Arrange
    const { text } = renderText();

    // Act
    const { value } = text;

    // Assert
    expect(value).toBe(
      [
        "eslint.config.js",
        "docs/",
        "src/components/Button.js",
        "src/index.js",
        "",
      ].join("\n")
    );
  });

  it("should show the new text of a sketch that changes while nothing was typed", () => {
    // Arrange
    const { store, text } = renderText();

    // Act
    act(() => {
      store.removeNode("docs");
      store.removeNode("src");
    });

    // Assert
    expect(text.value).toBe("eslint.config.js\n");
  });

  it("should show the new text after a node is added to the tree", () => {
    // Arrange
    const { store, text } = renderText();

    // Act
    act(() => store.addNode("file"));

    // Assert
    expect(text.value).toContain("new-file.js");
  });

  it("should draw a read only text when it cannot be edited", () => {
    // Arrange
    const { text } = renderText(SKETCH, NO_CAPABILITIES);

    // Act
    const { isReadOnly } = text;

    // Assert
    expect(isReadOnly).toBe(true);
  });

  it("should be editable otherwise", () => {
    // Arrange
    const { text } = renderText();

    // Act
    const { isReadOnly } = text;

    // Assert
    expect(isReadOnly).toBe(false);
  });

  it("should be editable when the host allows the tree to change, whatever else it allows", () => {
    // Arrange
    const { text } = renderText(SKETCH, {
      editTree: true,
      editDependencies: false,
      editConfig: false,
    });

    // Act
    const { isReadOnly } = text;

    // Assert
    expect(isReadOnly).toBe(false);
  });

  describe("reading what the user typed", () => {
    it("should show what the user types and keep it as the draft of the store", () => {
      // Arrange
      const { store, text } = renderText();

      // Act
      text.type("src/index.js\nsrc/new.js");

      // Assert
      expect(text.value).toBe("src/index.js\nsrc/new.js");
      expect(store.getState().textDraft).toBe("src/index.js\nsrc/new.js");
    });

    it("should not touch the sketch until the text is read", () => {
      // Arrange
      const { store, onSketchChange, text } = renderText();

      // Act
      text.type("src/index.js\nsrc/new.js\n");

      // Assert
      expect(store.getState().sketch).toBe(SKETCH);
      expect(onSketchChange).not.toHaveBeenCalled();
    });

    it("should read the text 300 ms after the last keystroke", () => {
      // Arrange
      const { onSketchChange, text } = renderText();

      // Act
      text.type("src/index.js\nsrc/new.js\n");
      wait(299);
      const before = onSketchChange.mock.calls.length;
      wait(1);

      // Assert
      expect(before).toBe(0);
      expect(getLastPaths(onSketchChange)).toEqual([
        "src/index.js",
        "src/new.js",
      ]);
    });

    it("should wait again after each keystroke", () => {
      // Arrange
      const { onSketchChange, text } = renderText();
      text.type("src/a.js\n");
      wait(200);

      // Act
      text.type("src/a.js\nsrc/b.js\n");
      wait(200);
      const before = onSketchChange.mock.calls.length;
      wait(100);

      // Assert
      expect(before).toBe(0);
      expect(onSketchChange).toHaveBeenCalledTimes(1);
      expect(getLastPaths(onSketchChange)).toEqual(["src/a.js", "src/b.js"]);
    });

    it("should read the text when the textarea loses the focus, without waiting", () => {
      // Arrange
      const { onSketchChange, text } = renderText();
      text.type("src/index.js\nsrc/new.js\n");

      // Act
      text.blur();

      // Assert
      expect(getLastPaths(onSketchChange)).toEqual([
        "src/index.js",
        "src/new.js",
      ]);
    });

    it("should read the text once when the delay goes by after a blur", () => {
      // Arrange
      const { onSketchChange, text } = renderText();
      text.type("src/index.js\nsrc/new.js\n");
      text.blur();

      // Act
      wait(1000);

      // Assert
      expect(onSketchChange).toHaveBeenCalledTimes(1);
    });

    it("should write the text again, in the order of the tree, when the text was read without problems and the textarea lost the focus", () => {
      // Arrange
      const { store, text } = renderText();
      text.type("src/index.js\nsrc/a.js\n");

      // Act
      text.blur();

      // Assert
      expect(text.value).toBe("eslint.config.js\nsrc/a.js\nsrc/index.js\n");
      expect(store.getState().textDraft).toBeUndefined();
    });

    it("should report no lines that cannot be read when the text is valid", () => {
      // Arrange
      const { text, getTextProblems } = renderText();

      // Act
      text.type("src/new.js\n");
      wait(300);

      // Assert
      expect(getTextProblems()).toEqual([]);
    });

    it("should keep the draft once it is read, while the user is typing", () => {
      // Arrange
      const { store, text } = renderText();
      text.type("src/index.js\nsrc/new.js");

      // Act
      wait(300);

      // Assert: the text is the one being typed, without the config line or the final newline that the sketch's has
      expect(text.value).toBe("src/index.js\nsrc/new.js");
      expect(store.getState().textDraft).toBe("src/index.js\nsrc/new.js");
      expect(store.getState().sketch.tree.map((node) => node.path)).toEqual([
        "src/index.js",
        "src/new.js",
      ]);
    });

    it("should call nothing when the text, once read, is the sketch it was", () => {
      // Arrange
      const { onSketchChange, store, text, getTextProblems } = renderText();

      // Act
      text.type("docs/\nsrc/components/Button.js\nsrc/index.js\n\n\n");
      wait(300);

      // Assert
      expect(onSketchChange).not.toHaveBeenCalled();
      expect(store.getState().sketch).toBe(SKETCH);
      expect(getTextProblems()).toEqual([]);
    });

    it("should call the change when a line is replaced and the number of lines does not change", () => {
      // Arrange
      const { onSketchChange, text } = renderText();

      // Act
      text.type("docs/\nsrc/components/Button.js\nsrc/main.js\n");
      wait(300);

      // Assert
      expect(getLastPaths(onSketchChange)).toEqual([
        "docs",
        "src/components/Button.js",
        "src/main.js",
      ]);
    });

    it("should drop a dependency that has no file or target in the text, and keep the others", () => {
      // Arrange
      const { onSketchChange, text } = renderText();

      // Act
      text.type("src/index.js\nsrc/components/Button.js\n");
      wait(300);
      text.type("src/index.js\n");
      wait(300);

      // Assert
      const calls = onSketchChange.mock.calls;

      expect((calls[0][0] as Sketch).dependencies).toHaveLength(1);
      expect((calls[1][0] as Sketch).dependencies).toEqual([]);
    });

    it("should call the change when only a dependency that points nowhere is dropped", () => {
      // Arrange
      const dangling: Sketch = {
        ...SKETCH,
        dependencies: [
          ...SKETCH.dependencies,
          {
            from: "ghost.js",
            target: { kind: "external", name: "react" },
            syntax: "import",
            importKind: "value",
            specifiers: [],
          },
        ],
      };
      const { onSketchChange, text } = renderText(dangling);

      // Act
      text.type("docs/\nsrc/components/Button.js\nsrc/index.js\n");
      wait(300);

      // Assert
      expect(onSketchChange).toHaveBeenCalledTimes(1);
      expect((onSketchChange.mock.calls[0][0] as Sketch).dependencies).toEqual(
        SKETCH.dependencies
      );
    });

    it("should read the text against the latest sketch, not the one of the keystroke", () => {
      // Arrange
      const { onSketchChange, store, text } = renderText();
      text.type("src/index.js\nsrc/components/Button.js\nsrc/new.js\n");

      // Act
      act(() => store.changeConfig("{ settings: { later: true } }"));
      wait(300);

      // Assert
      expect(store.getState().sketch.config).toBe(
        "{ settings: { later: true } }"
      );
      expect((onSketchChange.mock.lastCall?.[0] as Sketch).config).toBe(
        "{ settings: { later: true } }"
      );
      expect(getLastPaths(onSketchChange)).toEqual([
        "src/components/Button.js",
        "src/index.js",
        "src/new.js",
      ]);
    });

    it("should not read anything when the textarea loses the focus and nothing was typed", () => {
      // Arrange
      const { onSketchChange, store, text, getTextProblems } = renderText();

      // Act
      text.blur();

      // Assert
      expect(onSketchChange).not.toHaveBeenCalled();
      expect(store.getState().textDraft).toBeUndefined();
      expect(getTextProblems()).toEqual([]);
    });
  });

  describe("lines that cannot be read", () => {
    it("should be listed with their line, their text and why", () => {
      // Arrange
      const { text, getTextProblems } = renderText();

      // Act
      text.type("src/index.js\n  import x from 'y';\nsrc/../up.js\n");
      wait(300);

      // Assert
      expect(getTextProblems()).toEqual([
        "2|  import x from 'y';|Dependencies are not written in text mode yet.",
        "3|src/../up.js|The path cannot have `.` or `..` segments.",
      ]);
    });

    it("should be listed as soon as the user types, before the text is read", () => {
      // Arrange
      const { text, getTextProblems } = renderText();

      // Act
      text.type("src/../up.js\n");

      // Assert
      expect(getTextProblems()).toEqual([
        "1|src/../up.js|The path cannot have `.` or `..` segments.",
      ]);
    });

    it("should leave the valid lines applied", () => {
      // Arrange
      const { onSketchChange, text } = renderText();

      // Act
      text.type("src/index.js\nsrc/../up.js\nsrc/new.js\n");
      wait(300);

      // Assert
      expect(getLastPaths(onSketchChange)).toEqual([
        "src/index.js",
        "src/new.js",
      ]);
    });

    it("should stay in the draft when the textarea loses the focus", () => {
      // Arrange
      const { text, getTextProblems } = renderText();
      text.type("src/index.js\nsrc/../up.js\n");

      // Act
      text.blur();

      // Assert
      expect(text.value).toBe("src/index.js\nsrc/../up.js\n");
      expect(getTextProblems()).toHaveLength(1);
    });

    it("should write the text again once the user fixes them and the textarea loses the focus", () => {
      // Arrange
      const { text, getTextProblems } = renderText();
      text.type("src/index.js\nsrc/../up.js\n");
      text.blur();

      // Act
      text.type("src/index.js\nsrc/up.js\n");
      text.blur();

      // Assert
      expect(getTextProblems()).toEqual([]);
      expect(text.value).toBe("eslint.config.js\nsrc/index.js\nsrc/up.js\n");
    });

    it("should be listed no more once the user fixes them, while the textarea keeps the focus", () => {
      // Arrange
      const { text, getTextProblems } = renderText();
      text.type("src/../up.js\n");
      wait(300);

      // Act
      text.type("src/up.js\n");
      wait(300);

      // Assert
      expect(getTextProblems()).toEqual([]);
    });

    it("should go with the draft when the project goes back to the tree", () => {
      // Arrange
      const { store, text, getTextProblems } = renderText();
      act(() => store.setView("text"));
      text.type("src/../up.js\n");
      wait(300);

      // Act
      act(() => store.setView("tree"));

      // Assert
      expect(store.getState().textDraft).toBeUndefined();
      expect(getTextProblems()).toEqual([]);
    });

    it("should read nothing after the view is left", () => {
      // Arrange
      const { onSketchChange, store, text, unmount } = renderText();
      text.type("src/new.js\n");

      // Act
      unmount();
      wait(1000);

      // Assert
      expect(onSketchChange).not.toHaveBeenCalled();
      expect(store.getState().sketch).toBe(SKETCH);
    });
  });
});
