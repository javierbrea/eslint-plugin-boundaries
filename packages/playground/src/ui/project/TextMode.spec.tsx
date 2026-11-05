import { act, fireEvent, screen as view } from "@testing-library/react";
import type { ReactNode } from "react";

import type { Sketch } from "@/contract";
import { useTextProblems } from "@/ui/state";
import {
  NO_CAPABILITIES,
  renderInWorkbench,
} from "@/ui/state/__fixtures__/RenderInWorkbench";
import type { WorkbenchRender } from "@/ui/state/__fixtures__/RenderInWorkbench";

import { TextMode } from "./TextMode";

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

/**
 * Lists the lines of text mode that cannot be read, as the problems pane reads them.
 * @returns The lines, one per element.
 */
function TextProblemsProbe(): ReactNode {
  const problems = useTextProblems();

  return (
    <ul aria-label="Lines that cannot be read">
      {problems.map(({ line, text, reason }) => (
        <li key={line}>{`${line}|${text}|${reason}`}</li>
      ))}
    </ul>
  );
}

/**
 * Renders the text of a sketch in a workbench, with the lines that cannot be read listed next to it.
 * @param sketch The sketch to start from.
 * @param capabilities What the user can change.
 * @returns The render, the store and the spy of the sketches.
 */
function renderText(
  sketch: Sketch = SKETCH,
  capabilities?: Parameters<typeof renderInWorkbench>[1]["capabilities"]
): WorkbenchRender {
  return renderInWorkbench(
    <>
      <TextMode />
      <TextProblemsProbe />
    </>,
    { sketch, capabilities }
  );
}

/**
 * Gets the textarea.
 * @returns The element.
 */
function getText(): HTMLTextAreaElement {
  return view.getByRole("textbox", {
    name: "Project as text",
  }) as HTMLTextAreaElement;
}

/**
 * Types in the textarea, as the user does.
 * @param value The whole text after the keystroke.
 */
function type(value: string): void {
  fireEvent.change(getText(), { target: { value } });
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

/**
 * Lists the lines of text mode that cannot be read.
 * @returns The line, the text and the reason of each one.
 */
function getTextProblems(): string[] {
  return view
    .getAllByRole("list", { name: "Lines that cannot be read" })
    .flatMap((list) =>
      Array.from(list.querySelectorAll("li")).map(
        (item) => item.textContent as string
      )
    );
}

describe("TextMode", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should write the sketch with eslint.config.js first, a path per line and a slash after an empty folder", () => {
    // Arrange
    renderText();

    // Act
    const text = getText().value;

    // Assert
    expect(text).toBe(
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
    const { store } = renderText();

    // Act
    act(() => {
      store.removeNode("docs");
      store.removeNode("src");
    });

    // Assert
    expect(getText().value).toBe("eslint.config.js\n");
  });

  it("should show the new text after a node is added to the tree", () => {
    // Arrange
    const { store } = renderText();

    // Act
    act(() => store.addNode("file"));

    // Assert
    expect(getText().value).toContain("new-file.js");
  });

  it("should draw a read only text when it cannot be edited", () => {
    // Arrange
    renderText(SKETCH, NO_CAPABILITIES);

    // Act
    const readOnly = getText().readOnly;

    // Assert
    expect(readOnly).toBe(true);
  });

  it("should be editable otherwise", () => {
    // Arrange
    renderText();

    // Act
    const readOnly = getText().readOnly;

    // Assert
    expect(readOnly).toBe(false);
  });

  it("should be editable when the host allows the tree to change, whatever else it allows", () => {
    // Arrange
    renderText(SKETCH, {
      editTree: true,
      editDependencies: false,
      editConfig: false,
    });

    // Act
    const readOnly = getText().readOnly;

    // Assert
    expect(readOnly).toBe(false);
  });

  it("should not let the browser correct or wrap the paths", () => {
    // Arrange
    renderText();

    // Act
    const text = getText();

    // Assert
    expect(text.getAttribute("spellcheck")).toBe("false");
    expect(text.getAttribute("wrap")).toBe("off");
    expect(text.getAttribute("autocapitalize")).toBe("off");
  });

  describe("reading what the user typed", () => {
    it("should show what the user types and keep it as the draft of the store", () => {
      // Arrange
      const { store } = renderText();

      // Act
      type("src/index.js\nsrc/new.js");

      // Assert
      expect(getText().value).toBe("src/index.js\nsrc/new.js");
      expect(store.getState().textDraft).toBe("src/index.js\nsrc/new.js");
    });

    it("should not touch the sketch until the text is read", () => {
      // Arrange
      const { store, onSketchChange } = renderText();

      // Act
      type("src/index.js\nsrc/new.js\n");

      // Assert
      expect(store.getState().sketch).toBe(SKETCH);
      expect(onSketchChange).not.toHaveBeenCalled();
    });

    it("should read the text 300 ms after the last keystroke", () => {
      // Arrange
      const { onSketchChange } = renderText();

      // Act
      type("src/index.js\nsrc/new.js\n");
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
      const { onSketchChange } = renderText();
      type("src/a.js\n");
      wait(200);

      // Act
      type("src/a.js\nsrc/b.js\n");
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
      const { onSketchChange } = renderText();
      type("src/index.js\nsrc/new.js\n");

      // Act
      fireEvent.blur(getText());

      // Assert
      expect(getLastPaths(onSketchChange)).toEqual([
        "src/index.js",
        "src/new.js",
      ]);
    });

    it("should read the text once when the delay goes by after a blur", () => {
      // Arrange
      const { onSketchChange } = renderText();
      type("src/index.js\nsrc/new.js\n");
      fireEvent.blur(getText());

      // Act
      wait(1000);

      // Assert
      expect(onSketchChange).toHaveBeenCalledTimes(1);
    });

    it("should write the text again, in the order of the tree, when the text was read without problems and the textarea lost the focus", () => {
      // Arrange
      const { store } = renderText();
      type("src/index.js\nsrc/a.js\n");

      // Act
      fireEvent.blur(getText());

      // Assert
      expect(getText().value).toBe(
        "eslint.config.js\nsrc/a.js\nsrc/index.js\n"
      );
      expect(store.getState().textDraft).toBeUndefined();
    });

    it("should report no lines that cannot be read when the text is valid", () => {
      // Arrange
      renderText();

      // Act
      type("src/new.js\n");
      wait(300);

      // Assert
      expect(getTextProblems()).toEqual([]);
    });

    it("should keep the draft once it is read, while the user is typing", () => {
      // Arrange
      const { store } = renderText();
      type("src/index.js\nsrc/new.js");

      // Act
      wait(300);

      // Assert: the text is the one being typed, without the config line or the final newline that the sketch's has
      expect(getText().value).toBe("src/index.js\nsrc/new.js");
      expect(store.getState().textDraft).toBe("src/index.js\nsrc/new.js");
      expect(store.getState().sketch.tree.map((node) => node.path)).toEqual([
        "src/index.js",
        "src/new.js",
      ]);
    });

    it("should call nothing when the text, once read, is the sketch it was", () => {
      // Arrange
      const { onSketchChange, store } = renderText();

      // Act
      type("docs/\nsrc/components/Button.js\nsrc/index.js\n\n\n");
      wait(300);

      // Assert
      expect(onSketchChange).not.toHaveBeenCalled();
      expect(store.getState().sketch).toBe(SKETCH);
      expect(getTextProblems()).toEqual([]);
    });

    it("should call the change when a line is replaced and the number of lines does not change", () => {
      // Arrange
      const { onSketchChange } = renderText();

      // Act
      type("docs/\nsrc/components/Button.js\nsrc/main.js\n");
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
      const { onSketchChange } = renderText();

      // Act
      type("src/index.js\nsrc/components/Button.js\n");
      wait(300);
      type("src/index.js\n");
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
      const { onSketchChange } = renderText(dangling);

      // Act
      type("docs/\nsrc/components/Button.js\nsrc/index.js\n");
      wait(300);

      // Assert
      expect(onSketchChange).toHaveBeenCalledTimes(1);
      expect((onSketchChange.mock.calls[0][0] as Sketch).dependencies).toEqual(
        SKETCH.dependencies
      );
    });

    it("should read the text against the latest sketch, not the one of the keystroke", () => {
      // Arrange
      const { onSketchChange, store } = renderText();
      type("src/index.js\nsrc/components/Button.js\nsrc/new.js\n");

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
      const { onSketchChange, store } = renderText();

      // Act
      fireEvent.blur(getText());

      // Assert
      expect(onSketchChange).not.toHaveBeenCalled();
      expect(store.getState().textDraft).toBeUndefined();
      expect(getTextProblems()).toEqual([]);
    });
  });

  describe("lines that cannot be read", () => {
    it("should be listed with their line, their text and why", () => {
      // Arrange
      renderText();

      // Act
      type("src/index.js\n  import x from 'y';\nsrc/../up.js\n");
      wait(300);

      // Assert
      expect(getTextProblems()).toEqual([
        "2|  import x from 'y';|Dependencies are not written in text mode yet.",
        "3|src/../up.js|The path cannot have `.` or `..` segments.",
      ]);
    });

    it("should be listed as soon as the user types, before the text is read", () => {
      // Arrange
      renderText();

      // Act
      type("src/../up.js\n");

      // Assert
      expect(getTextProblems()).toEqual([
        "1|src/../up.js|The path cannot have `.` or `..` segments.",
      ]);
    });

    it("should leave the valid lines applied", () => {
      // Arrange
      const { onSketchChange } = renderText();

      // Act
      type("src/index.js\nsrc/../up.js\nsrc/new.js\n");
      wait(300);

      // Assert
      expect(getLastPaths(onSketchChange)).toEqual([
        "src/index.js",
        "src/new.js",
      ]);
    });

    it("should stay in the draft when the textarea loses the focus", () => {
      // Arrange
      renderText();
      type("src/index.js\nsrc/../up.js\n");

      // Act
      fireEvent.blur(getText());

      // Assert
      expect(getText().value).toBe("src/index.js\nsrc/../up.js\n");
      expect(getTextProblems()).toHaveLength(1);
    });

    it("should write the text again once the user fixes them and the textarea loses the focus", () => {
      // Arrange
      renderText();
      type("src/index.js\nsrc/../up.js\n");
      fireEvent.blur(getText());

      // Act
      type("src/index.js\nsrc/up.js\n");
      fireEvent.blur(getText());

      // Assert
      expect(getTextProblems()).toEqual([]);
      expect(getText().value).toBe(
        "eslint.config.js\nsrc/index.js\nsrc/up.js\n"
      );
    });

    it("should be listed no more once the user fixes them, while the textarea keeps the focus", () => {
      // Arrange
      renderText();
      type("src/../up.js\n");
      wait(300);

      // Act
      type("src/up.js\n");
      wait(300);

      // Assert
      expect(getTextProblems()).toEqual([]);
    });

    it("should go with the draft when the project goes back to the tree", () => {
      // Arrange
      const { store } = renderText();
      act(() => store.setView("text"));
      type("src/../up.js\n");
      wait(300);

      // Act
      act(() => store.setView("tree"));

      // Assert
      expect(store.getState().textDraft).toBeUndefined();
      expect(getTextProblems()).toEqual([]);
    });

    it("should read nothing after the view is left", () => {
      // Arrange
      const { onSketchChange, store, unmount } = renderText();
      type("src/new.js\n");

      // Act
      unmount();
      wait(1000);

      // Assert
      expect(onSketchChange).not.toHaveBeenCalled();
      expect(store.getState().sketch).toBe(SKETCH);
    });
  });
});
