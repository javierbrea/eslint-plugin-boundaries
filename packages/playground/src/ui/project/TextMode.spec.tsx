import { act, fireEvent, render, screen as view } from "@testing-library/react";
import { useState } from "react";
import type { ReactNode } from "react";

import type { Sketch } from "../../contract";

import { TextMode } from "./TextMode";
import type { TextModeProps } from "./TextMode.types";

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
 * Creates the props of the text, with mocks for its callbacks.
 * @param overrides What differs from an editable text of the sketch.
 * @returns The props.
 */
function createProps(overrides: Partial<TextModeProps> = {}): TextModeProps & {
  onSketchChange: jest.Mock;
  onTextProblems: jest.Mock;
} {
  return {
    sketch: SKETCH,
    readOnly: false,
    ...overrides,
    onSketchChange: jest.fn(),
    onTextProblems: jest.fn(),
  };
}

/**
 * Holds the sketch as the workbench does, so that what the text reads shows in the next render.
 * @param props The first sketch, and the mock of the problems.
 * @param props.onTextProblems
 * @returns The text.
 */
function Stateful({
  onTextProblems,
}: Readonly<{ onTextProblems: jest.Mock }>): ReactNode {
  const [sketch, setSketch] = useState(SKETCH);

  return (
    <TextMode
      sketch={sketch}
      readOnly={false}
      onSketchChange={setSketch}
      onTextProblems={onTextProblems}
    />
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

describe("TextMode", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should write the sketch with eslint.config.js first, a path per line and a slash after an empty folder", () => {
    // Arrange
    render(<TextMode {...createProps()} />);

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
    const props = createProps();
    const { rerender } = render(<TextMode {...props} />);

    // Act
    rerender(
      <TextMode
        {...props}
        sketch={{ ...SKETCH, tree: [{ path: "a.js", kind: "file" }] }}
      />
    );

    // Assert
    expect(getText().value).toBe("eslint.config.js\na.js\n");
  });

  it("should draw a read only text when it cannot be edited", () => {
    // Arrange
    render(<TextMode {...createProps({ readOnly: true })} />);

    // Act
    const readOnly = getText().readOnly;

    // Assert
    expect(readOnly).toBe(true);
  });

  it("should be editable otherwise", () => {
    // Arrange
    render(<TextMode {...createProps()} />);

    // Act
    const readOnly = getText().readOnly;

    // Assert
    expect(readOnly).toBe(false);
  });

  it("should not let the browser correct or wrap the paths", () => {
    // Arrange
    render(<TextMode {...createProps()} />);

    // Act
    const text = getText();

    // Assert
    expect(text.getAttribute("spellcheck")).toBe("false");
    expect(text.getAttribute("wrap")).toBe("off");
    expect(text.getAttribute("autocapitalize")).toBe("off");
  });

  describe("reading what the user typed", () => {
    it("should show what the user types", () => {
      // Arrange
      render(<TextMode {...createProps()} />);

      // Act
      type("src/index.js\nsrc/new.js");

      // Assert
      expect(getText().value).toBe("src/index.js\nsrc/new.js");
    });

    it("should read the text 300 ms after the last keystroke", () => {
      // Arrange
      const props = createProps();
      render(<TextMode {...props} />);

      // Act
      type("src/index.js\nsrc/new.js\n");
      wait(299);
      const before = props.onSketchChange.mock.calls.length;
      wait(1);

      // Assert
      expect(before).toBe(0);
      expect(getLastPaths(props.onSketchChange)).toEqual([
        "src/index.js",
        "src/new.js",
      ]);
    });

    it("should wait again after each keystroke", () => {
      // Arrange
      const props = createProps();
      render(<TextMode {...props} />);
      type("src/a.js\n");
      wait(200);

      // Act
      type("src/a.js\nsrc/b.js\n");
      wait(200);
      const before = props.onSketchChange.mock.calls.length;
      wait(100);

      // Assert
      expect(before).toBe(0);
      expect(props.onSketchChange).toHaveBeenCalledTimes(1);
      expect(getLastPaths(props.onSketchChange)).toEqual([
        "src/a.js",
        "src/b.js",
      ]);
    });

    it("should read the text when the textarea loses the focus, without waiting", () => {
      // Arrange
      const props = createProps();
      render(<TextMode {...props} />);
      type("src/index.js\nsrc/new.js\n");

      // Act
      fireEvent.blur(getText());

      // Assert
      expect(getLastPaths(props.onSketchChange)).toEqual([
        "src/index.js",
        "src/new.js",
      ]);
    });

    it("should read the text once when the delay goes by after a blur", () => {
      // Arrange
      const props = createProps();
      render(<TextMode {...props} />);
      type("src/index.js\nsrc/new.js\n");
      fireEvent.blur(getText());

      // Act
      wait(1000);

      // Assert
      expect(props.onSketchChange).toHaveBeenCalledTimes(1);
    });

    it("should write the text again, in the order of the tree, when the text was read without problems and the textarea lost the focus", () => {
      // Arrange
      render(<Stateful onTextProblems={jest.fn()} />);
      type("src/index.js\nsrc/a.js\n");

      // Act
      fireEvent.blur(getText());

      // Assert
      expect(getText().value).toBe(
        "eslint.config.js\nsrc/a.js\nsrc/index.js\n"
      );
    });

    it("should report no problems when the text is valid", () => {
      // Arrange
      const props = createProps();
      render(<TextMode {...props} />);

      // Act
      type("src/new.js\n");
      wait(300);

      // Assert
      expect(props.onTextProblems).toHaveBeenCalledWith([]);
    });

    it("should keep the draft while it is read, as the sketch changes under it", () => {
      // Arrange
      const props = createProps();
      const { rerender } = render(<TextMode {...props} />);
      type("src/index.js\nsrc/new.js");
      wait(300);

      // Act
      rerender(
        <TextMode
          {...props}
          sketch={{
            ...SKETCH,
            tree: [
              { path: "src/index.js", kind: "file" },
              { path: "src/new.js", kind: "file" },
            ],
          }}
        />
      );

      // Assert: the text is the one being typed, without the config line or the final newline that the sketch's has
      expect(getText().value).toBe("src/index.js\nsrc/new.js");
    });

    it("should call nothing when the text, once read, is the sketch it was", () => {
      // Arrange
      const props = createProps();
      render(<TextMode {...props} />);

      // Act
      type("docs/\nsrc/components/Button.js\nsrc/index.js\n\n\n");
      wait(300);

      // Assert
      expect(props.onSketchChange).not.toHaveBeenCalled();
      expect(props.onTextProblems).toHaveBeenCalledWith([]);
    });

    it("should call the change when a line is replaced and the number of lines does not change", () => {
      // Arrange
      const props = createProps();
      render(<TextMode {...props} />);

      // Act
      type("docs/\nsrc/components/Button.js\nsrc/main.js\n");
      wait(300);

      // Assert
      expect(getLastPaths(props.onSketchChange)).toEqual([
        "docs",
        "src/components/Button.js",
        "src/main.js",
      ]);
    });

    it("should drop a dependency that has no file or target in the text, and keep the others", () => {
      // Arrange
      const props = createProps();
      render(<TextMode {...props} />);

      // Act
      type("src/index.js\nsrc/components/Button.js\n");
      wait(300);
      type("src/index.js\n");
      wait(300);

      // Assert
      const calls = props.onSketchChange.mock.calls;

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
      const props = createProps({ sketch: dangling });
      render(<TextMode {...props} />);

      // Act
      type("docs/\nsrc/components/Button.js\nsrc/index.js\n");
      wait(300);

      // Assert
      expect(props.onSketchChange).toHaveBeenCalledTimes(1);
      expect(
        (props.onSketchChange.mock.calls[0][0] as Sketch).dependencies
      ).toEqual(SKETCH.dependencies);
    });

    it("should read the text against the latest sketch, not the one of the keystroke", () => {
      // Arrange
      const props = createProps();
      const { rerender } = render(<TextMode {...props} />);
      type("src/index.js\nsrc/components/Button.js\nsrc/new.js\n");
      const withExtra: Sketch = {
        ...SKETCH,
        config: "{ settings: { later: true } }",
      };

      // Act
      rerender(<TextMode {...props} sketch={withExtra} />);
      wait(300);

      // Assert
      expect((props.onSketchChange.mock.calls[0][0] as Sketch).config).toBe(
        "{ settings: { later: true } }"
      );
    });

    it("should not read anything when the textarea loses the focus and nothing was typed", () => {
      // Arrange
      const props = createProps();
      render(<TextMode {...props} />);

      // Act
      fireEvent.blur(getText());

      // Assert
      expect(props.onSketchChange).not.toHaveBeenCalled();
      expect(props.onTextProblems).not.toHaveBeenCalled();
    });
  });

  describe("lines that cannot be read", () => {
    it("should report them with their line, their text and why", () => {
      // Arrange
      const props = createProps();
      render(<TextMode {...props} />);

      // Act
      type("src/index.js\n  import x from 'y';\nsrc/../up.js\n");
      wait(300);

      // Assert
      expect(props.onTextProblems).toHaveBeenCalledWith([
        {
          line: 2,
          text: "  import x from 'y';",
          reason: "Dependencies are not written in text mode yet.",
        },
        {
          line: 3,
          text: "src/../up.js",
          reason: "The path cannot have `.` or `..` segments.",
        },
      ]);
    });

    it("should apply the valid lines", () => {
      // Arrange
      const props = createProps();
      render(<TextMode {...props} />);

      // Act
      type("src/index.js\nsrc/../up.js\nsrc/new.js\n");
      wait(300);

      // Assert
      expect(getLastPaths(props.onSketchChange)).toEqual([
        "src/index.js",
        "src/new.js",
      ]);
    });

    it("should keep them in the draft when the textarea loses the focus", () => {
      // Arrange
      const props = createProps();
      render(<TextMode {...props} />);
      type("src/index.js\nsrc/../up.js\n");

      // Act
      fireEvent.blur(getText());

      // Assert
      expect(getText().value).toBe("src/index.js\nsrc/../up.js\n");
    });

    it("should write the text again once the user fixes them and the textarea loses the focus", () => {
      // Arrange
      const onTextProblems = jest.fn();
      render(<Stateful onTextProblems={onTextProblems} />);
      type("src/index.js\nsrc/../up.js\n");
      fireEvent.blur(getText());

      // Act
      type("src/index.js\nsrc/up.js\n");
      fireEvent.blur(getText());

      // Assert
      expect(onTextProblems).toHaveBeenLastCalledWith([]);
      expect(getText().value).toBe(
        "eslint.config.js\nsrc/index.js\nsrc/up.js\n"
      );
    });

    it("should report an empty list for the lines that were fixed, while the textarea keeps the focus", () => {
      // Arrange
      const props = createProps();
      render(<TextMode {...props} />);
      type("src/../up.js\n");
      wait(300);

      // Act
      type("src/up.js\n");
      wait(300);

      // Assert
      expect(props.onTextProblems).toHaveBeenLastCalledWith([]);
    });

    it("should drop them and report an empty list when the view is left", () => {
      // Arrange
      const props = createProps();
      const { unmount } = render(<TextMode {...props} />);
      type("src/../up.js\n");
      wait(300);
      props.onTextProblems.mockClear();

      // Act
      unmount();

      // Assert
      expect(props.onTextProblems).toHaveBeenCalledTimes(1);
      expect(props.onTextProblems).toHaveBeenCalledWith([]);
    });

    it("should report nothing when the view is left without problems", () => {
      // Arrange
      const props = createProps();
      const { unmount } = render(<TextMode {...props} />);
      type("src/up.js\n");
      wait(300);
      props.onTextProblems.mockClear();

      // Act
      unmount();

      // Assert
      expect(props.onTextProblems).not.toHaveBeenCalled();
    });

    it("should report with the latest callback when the view is left", () => {
      // Arrange
      const props = createProps();
      const { rerender, unmount } = render(<TextMode {...props} />);
      type("src/../up.js\n");
      wait(300);
      const latest = jest.fn();

      // Act
      rerender(<TextMode {...props} onTextProblems={latest} />);
      unmount();

      // Assert
      expect(latest).toHaveBeenCalledWith([]);
    });

    it("should read nothing after the view is left", () => {
      // Arrange
      const props = createProps();
      const { unmount } = render(<TextMode {...props} />);
      type("src/new.js\n");

      // Act
      unmount();
      wait(1000);

      // Assert
      expect(props.onSketchChange).not.toHaveBeenCalled();
    });
  });
});
