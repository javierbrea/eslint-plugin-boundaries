import { act } from "@testing-library/react";

import type { ProjectCapabilities, Sketch } from "@/contract";
import { LATE_AFTER } from "@/domains/evaluation/helpers/evaluator";
import {
  EXAMPLES,
  QUICK_START_EXAMPLE,
} from "@/domains/examples/data/examples";
import { MAX_SKETCH_NODES } from "@/domains/project/helpers/sketch/sketch.constants";
import { EVALUATION_DELAY } from "@/domains/session/data/store";
import {
  ALL_CAPABILITIES,
  NO_CAPABILITIES,
  failEvaluation,
  releaseEvaluation,
  renderInSession,
  waitUntilEvaluationIsLate,
  waitUntilEvaluationStops,
} from "@/domains/session/data/store/store.mock";
import { LONG_LINK_LENGTH } from "@/domains/share/helpers/sketchHash";
import { SHARE_COPIED_DURATION } from "@/domains/share/modules/hooks/useShareLink";
import type { MakeLink } from "@/domains/share/modules/hooks/useShareLink";
import { holdInlineWorkers } from "@/shared/testing/inlineWorker";
import { ThemeRoot } from "@/ui-kit/providers/ThemeRoot";

import { ShellTopBar } from "./ShellTopBar";
import { ShellTopBarPom } from "./ShellTopBar.pom";
import type { ShellTopBarProps } from "./ShellTopBar.types";

const QUICK_START = QUICK_START_EXAMPLE.sketch;

/** What the status says before the number of problems, which the problems of the sketch decide. */
const STATUS_START = /^(\d+ files?) · (\d+ (?:dependency|dependencies)) · /;

/**
 * Reads the files and the dependencies of the status.
 * @param bar The page object of the bar.
 * @returns The number of files and the number of dependencies, as the status writes them.
 */
function readCounts(bar: ShellTopBarPom): string[] {
  return STATUS_START.exec(bar.bar.statusText)?.slice(1) ?? [];
}

const SHORT_LINK = "https://example.com/playground/#v=1&s=abc";

const LONG_LINK = `https://example.com/playground/#v=1&s=${"a".repeat(
  LONG_LINK_LENGTH
)}`;

/**
 * Makes a sketch with the number of files given and nothing else.
 * @param fileCount How many files.
 * @returns The sketch.
 */
function createSketchOfFiles(fileCount: number): Sketch {
  return {
    config: QUICK_START.config,
    tree: Array.from({ length: fileCount }, (_, index) => ({
      path: `src/f${index}.js`,
      kind: "file",
    })),
    dependencies: [],
  };
}

/** A sketch with one file more than a link can hold, which no link would open. */
const TOO_LARGE_SKETCH = createSketchOfFiles(MAX_SKETCH_NODES + 1);

/** A sketch that the reader of links refuses for another cause: a path that ends with a space. */
const INVALID_SKETCH: Sketch = {
  config: QUICK_START.config,
  tree: [{ path: "src/a.js ", kind: "file" }],
  dependencies: [],
};

/** How long a spec lets pass to see that a dialog does not close by itself, which is far more than anything the share waits for. */
const A_MINUTE = 60_000;

/** How long a spec lets pass after that for a dialog that closed to fade out and be gone, which is far more than its transition takes. */
const TIME_TO_BE_GONE = 1000;

/**
 * Builds the props of a bar that cannot share, with a spy for each callback.
 * @param overrides What differs.
 * @returns The props.
 */
function createProps(
  overrides: Partial<ShellTopBarProps> = {}
): ShellTopBarProps {
  return { onReset: jest.fn(), onSelectExample: jest.fn(), ...overrides };
}

/**
 * Renders the bar in an instance of the playground, inside the root element where its theme and its overlays are.
 * @param props What the bar gets from the shell.
 * @param options What differs from an instance of the quick start in which everything can be edited.
 * @param options.sketch The sketch the instance starts from.
 * @param options.capabilities What the user can change.
 * @returns The page object of the bar, the store of the instance, and the way to remove the instance.
 */
function renderBar(
  props: ShellTopBarProps = createProps(),
  {
    sketch = QUICK_START,
    capabilities = ALL_CAPABILITIES,
  }: { sketch?: Sketch; capabilities?: ProjectCapabilities } = {}
): {
  bar: ShellTopBarPom;
  store: ReturnType<typeof renderInSession>["store"];
  unmount: () => void;
} {
  const { store, unmount } = renderInSession(
    <ThemeRoot>
      <ShellTopBar {...props} />
    </ThemeRoot>,
    { sketch, capabilities }
  );

  return { bar: new ShellTopBarPom(), store, unmount };
}

/**
 * Replaces the clipboard of the browser, which jsdom does not have.
 * @param writeText What the clipboard does when it is given the link.
 * @returns The spy of `writeText`.
 */
function stubClipboard(
  writeText: (text: string) => Promise<void> = () => Promise.resolve()
): jest.Mock<Promise<void>, [string]> {
  const spy = jest.fn(writeText);

  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: spy },
  });

  return spy;
}

/**
 * Finds the timers that keep the confirmation of a link that was copied, among the ones the window was asked to start.
 * @param setTimeoutSpy The spy of `window.setTimeout`.
 * @returns The ids of the timers that last as long as that confirmation.
 */
function findConfirmationTimers(
  setTimeoutSpy: jest.SpyInstance<number, Parameters<typeof setTimeout>>
): number[] {
  return setTimeoutSpy.mock.calls.flatMap(([, delay], index) =>
    delay === SHARE_COPIED_DURATION
      ? [setTimeoutSpy.mock.results[index].value as number]
      : []
  );
}

/** What Share and the region beside it say. */
type ShareFace = {
  /** What a user reads on Share. */
  readonly visibleText: string;
  /** What the region says to screen readers. */
  readonly announced: string;
};

/** What Share and its region say before a copy, and once its confirmation is over. */
const SHARE_AT_REST: ShareFace = { visibleText: "Share", announced: "" };

/** What Share and its region say while they confirm a copy. */
const SHARE_COPIED: ShareFace = {
  visibleText: "Copied",
  announced: "Link copied",
};

/**
 * Reads what Share and the region beside it say.
 * @param bar The page object of the bar.
 * @returns The text of Share and the text of the region.
 */
function readShare(bar: ShellTopBarPom): ShareFace {
  return {
    visibleText: bar.actions.share.visibleText,
    announced: bar.actions.announcement.text,
  };
}

/** What the button that copies the link again and the region of the dialog say. */
type CopyAgainFace = {
  /** What a user reads on the button. */
  readonly visibleText: string;
  /** Whether the button draws its confirmation in place of its label. */
  readonly isShowingCopied: boolean;
  /** What the region of the dialog says to screen readers. */
  readonly announced: string;
};

/**
 * Reads what the button that copies the link again and the region of the dialog say.
 * @param bar The page object of the bar, with the dialog of a link that could not be copied open.
 * @returns The text of the button, whether it confirms, and the text of the region.
 */
function readCopyAgain(bar: ShellTopBarPom): CopyAgainFace {
  const { copyButton, announcement } = bar.shareDialog;

  return {
    visibleText: copyButton.visibleText,
    isShowingCopied: copyButton.isShowingCopied,
    announced: announcement.text,
  };
}

/**
 * Presses Share and lets the share end, which is when the link is made and copied or refused.
 * @param bar The page object of the bar.
 */
async function pressShare(bar: ShellTopBarPom): Promise<void> {
  await act(async () => {
    bar.actions.pressShare();
  });
}

/**
 * Lets time pass inside `act`, so that the timers of the bar run.
 * @param milliseconds How much time passes.
 */
function pass(milliseconds: number): void {
  act(() => {
    jest.advanceTimersByTime(milliseconds);
  });
}

/** A share that ends in a notice: what the host and the clipboard do, and the sketch on screen. */
type NoticeCase = {
  /** The kind of the notice, as the hook names it. */
  readonly kind: string;
  /** The title of the dialog that tells it. */
  readonly title: string;
  /** What the host does when it is asked for the link. */
  readonly makeLink: MakeLink;
  /** The sketch on screen. */
  readonly sketch: Sketch;
  /** Whether the clipboard refuses the link. */
  readonly clipboardRefuses: boolean;
};

const LONG_CASE: NoticeCase = {
  kind: "long",
  title: "Long link copied",
  makeLink: () => Promise.resolve(LONG_LINK),
  sketch: QUICK_START,
  clipboardRefuses: false,
};

const NOT_COPIED_CASE: NoticeCase = {
  kind: "not-copied",
  title: "The link could not be copied",
  makeLink: () => Promise.resolve(SHORT_LINK),
  sketch: QUICK_START,
  clipboardRefuses: true,
};

const NOT_MADE_CASE: NoticeCase = {
  kind: "not-made",
  title: "The link could not be made",
  makeLink: () => Promise.reject(new Error("no link")),
  sketch: QUICK_START,
  clipboardRefuses: false,
};

const TOO_LARGE_CASE: NoticeCase = {
  kind: "too-large",
  title: "The project is too large for a link",
  makeLink: () => Promise.resolve(SHORT_LINK),
  sketch: TOO_LARGE_SKETCH,
  clipboardRefuses: false,
};

const INVALID_CASE: NoticeCase = {
  kind: "invalid",
  title: "The project cannot be shared",
  makeLink: () => Promise.resolve(SHORT_LINK),
  sketch: INVALID_SKETCH,
  clipboardRefuses: false,
};

const NOTICE_CASES: readonly NoticeCase[] = [
  LONG_CASE,
  NOT_COPIED_CASE,
  NOT_MADE_CASE,
  TOO_LARGE_CASE,
  INVALID_CASE,
];

/**
 * Renders the bar in a share that ends in a notice, and presses Share.
 * @param noticeCase What the host, the clipboard and the sketch do.
 * @param noticeCase.makeLink
 * @param noticeCase.sketch
 * @param noticeCase.clipboardRefuses
 * @returns The page object of the bar, once the share ended.
 */
async function renderNotice({
  makeLink,
  sketch,
  clipboardRefuses,
}: NoticeCase): Promise<ShellTopBarPom> {
  if (clipboardRefuses) {
    stubClipboard(() => Promise.reject(new Error("denied")));
  }

  const { bar } = renderBar(createProps({ makeLink }), { sketch });

  await pressShare(bar);
  return bar;
}

describe("ShellTopBar", () => {
  beforeEach(() => {
    stubClipboard();
  });

  afterEach(() => {
    jest.useRealTimers();
    Reflect.deleteProperty(navigator, "clipboard");
  });

  it("should say how many files and dependencies the sketch has", () => {
    // Arrange
    const { bar } = renderBar();

    // Act
    const counts = readCounts(bar);

    // Assert
    expect(counts).toEqual(["6 files", "9 dependencies"]);
  });

  it("should count the dependencies again at once when one is removed", () => {
    // Arrange
    const { bar, store } = renderBar();

    // Act
    act(() => store.removeDependency({ path: "src/index.js", index: 0 }));

    // Assert
    expect(readCounts(bar)).toEqual(["6 files", "8 dependencies"]);
  });

  it("should say one dependency in the singular", () => {
    // Arrange
    const { bar, store } = renderBar(createProps(), {
      sketch: { ...QUICK_START, dependencies: [] },
    });

    // Act
    act(() =>
      store.addDependency({
        from: "src/index.js",
        target: { kind: "external", name: "react" },
        syntax: "import",
        importKind: "value",
        specifiers: [],
      })
    );

    // Assert
    expect(readCounts(bar)).toEqual(["6 files", "1 dependency"]);
  });

  it("should count 0 dependencies for a sketch that has none", () => {
    // Arrange
    const { bar } = renderBar(createProps(), {
      sketch: { ...QUICK_START, dependencies: [] },
    });

    // Act
    const counts = readCounts(bar);

    // Assert
    expect(counts).toEqual(["6 files", "0 dependencies"]);
  });

  it("should keep the dependencies in the status while the config has errors", () => {
    // Arrange
    jest.useFakeTimers();
    const { bar, store } = renderBar();

    // Act
    act(() => store.changeConfig("{ settings: "));
    act(() => {
      jest.advanceTimersByTime(EVALUATION_DELAY);
    });

    // Assert
    expect(bar.bar.statusText).toBe(
      "6 files · 9 dependencies · config has errors"
    );
  });

  describe("before the first evaluation", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      holdInlineWorkers();
    });

    it("should say how many files and dependencies the sketch has, and nothing about the problems", () => {
      // Arrange
      const { bar } = renderBar();

      // Act
      act(() => {
        jest.advanceTimersByTime(LATE_AFTER - 1);
      });

      // Assert
      expect(bar.bar.statusText).toBe("6 files · 9 dependencies");
      expect(bar.bar.hasProblems).toBe(false);
      expect(bar.bar.dotColor).toBe("var(--jsb-faint)");
    });

    it("should count the files and the dependencies again at once after an edit", () => {
      // Arrange
      const { bar, store } = renderBar();

      // Act
      act(() => store.removeDependency({ path: "src/index.js", index: 0 }));
      const afterDependency = bar.bar.statusText;
      act(() => store.removeNode("src/modules/checkout/index.js"));

      // Assert
      expect(afterDependency).toBe("6 files · 8 dependencies");
      expect(bar.bar.statusText).toBe("5 files · 4 dependencies");
    });

    it("should say that the project is being evaluated once the evaluation is late", () => {
      // Arrange
      const { bar } = renderBar();

      // Act
      waitUntilEvaluationIsLate();

      // Assert
      expect(bar.bar.statusText).toBe("6 files · 9 dependencies · evaluating…");
      expect(bar.bar.problemsColor).toBe("var(--jsb-muted)");
      expect(bar.bar.dotColor).toBe("var(--jsb-faint)");
      expect(bar.bar.announcement).toBe("");
    });

    it("should say that the evaluation was stopped when it takes longer than the limit", () => {
      // Arrange
      const { bar } = renderBar();

      // Act
      waitUntilEvaluationStops();

      // Assert
      expect(bar.bar.statusText).toBe(
        "6 files · 9 dependencies · evaluation stopped"
      );
      expect(bar.bar.problemsColor).toBe(
        "color-mix(in srgb, var(--jsb-warn) 85%, var(--jsb-ink))"
      );
      expect(bar.bar.dotColor).toBe("var(--jsb-warn)");
      expect(bar.bar.announcement).toBe("evaluation stopped");
    });

    it("should say that the evaluation failed when its worker fails", () => {
      // Arrange
      const { bar } = renderBar();

      // Act
      failEvaluation();

      // Assert
      expect(bar.bar.statusText).toBe(
        "6 files · 9 dependencies · evaluation failed"
      );
      expect(bar.bar.problemsColor).toBe(
        "color-mix(in srgb, var(--jsb-bad) 85%, var(--jsb-ink))"
      );
      expect(bar.bar.dotColor).toBe("var(--jsb-bad)");
      expect(bar.bar.announcement).toBe("evaluation failed");
    });

    it("should count the problems when the evaluation arrives", () => {
      // Arrange
      const { bar } = renderBar();
      waitUntilEvaluationIsLate();

      // Act
      releaseEvaluation();

      // Assert
      expect(bar.bar.statusText).toBe("6 files · 9 dependencies · 2 problems");
      expect(bar.bar.dotColor).toBe("var(--jsb-ok)");
      expect(bar.bar.announcement).toBe("");
    });
  });

  describe("an evaluation that is out of date", () => {
    /**
     * Renders the bar with the evaluation of the sketch, and then removes a dependency while the worker holds the request of the new sketch.
     * @returns The page object of the bar and the store.
     */
    function renderOutOfDate(): ReturnType<typeof renderBar> {
      jest.useFakeTimers();

      const render = renderBar();

      holdInlineWorkers();
      act(() =>
        render.store.removeDependency({ path: "src/index.js", index: 0 })
      );
      return render;
    }

    it("should count the new sketch at once, and keep saying the problems while the evaluation is not late", () => {
      // Arrange
      const { bar } = renderOutOfDate();

      // Act
      act(() => {
        jest.advanceTimersByTime(LATE_AFTER - 1);
      });

      // Assert
      expect(bar.bar.statusText).toBe("6 files · 8 dependencies · 2 problems");
      expect(bar.bar.dotColor).toBe("var(--jsb-ok)");
    });

    it("should say that the project is being evaluated in place of the problems once the evaluation is late", () => {
      // Arrange
      const { bar } = renderOutOfDate();

      // Act
      waitUntilEvaluationIsLate();

      // Assert
      expect(bar.bar.statusText).toBe("6 files · 8 dependencies · evaluating…");
      expect(bar.bar.dotColor).toBe("var(--jsb-faint)");
    });

    it("should say that the evaluation was stopped in place of the problems", () => {
      // Arrange
      const { bar } = renderOutOfDate();

      // Act
      waitUntilEvaluationStops();

      // Assert
      expect(bar.bar.statusText).toBe(
        "6 files · 8 dependencies · evaluation stopped"
      );
      expect(bar.bar.dotColor).toBe("var(--jsb-warn)");
      expect(bar.bar.announcement).toBe("evaluation stopped");
    });

    it("should say that the evaluation failed in place of the problems", () => {
      // Arrange
      const { bar } = renderOutOfDate();

      // Act
      failEvaluation();

      // Assert
      expect(bar.bar.statusText).toBe(
        "6 files · 8 dependencies · evaluation failed"
      );
      expect(bar.bar.dotColor).toBe("var(--jsb-bad)");
      expect(bar.bar.announcement).toBe("evaluation failed");
    });

    it("should say the problems again when the evaluation arrives", () => {
      // Arrange
      const { bar } = renderOutOfDate();
      waitUntilEvaluationIsLate();

      // Act
      releaseEvaluation();

      // Assert
      expect(bar.bar.statusText).toBe("6 files · 8 dependencies · 2 problems");
      expect(bar.bar.dotColor).toBe("var(--jsb-ok)");
    });
  });

  describe("the picker of examples", () => {
    it("should be there when the source can edit the tree, the dependencies and the config", () => {
      // Arrange
      const { bar } = renderBar();

      // Act
      const { isRendered } = bar.picker;

      // Assert
      expect(isRendered).toBe(true);
    });

    it.each<[string, ProjectCapabilities]>([
      [
        "the tree",
        { editTree: false, editDependencies: true, editConfig: true },
      ],
      [
        "the dependencies",
        { editTree: true, editDependencies: false, editConfig: true },
      ],
      [
        "the config",
        { editTree: true, editDependencies: true, editConfig: false },
      ],
      ["anything", NO_CAPABILITIES],
    ])(
      "should not be there when the source cannot edit %s, because an example replaces all three",
      (_name, capabilities) => {
        // Arrange
        const { bar } = renderBar(createProps(), { capabilities });

        // Act
        const { isRendered } = bar.picker;

        // Assert
        expect(isRendered).toBe(false);
        expect(bar.bar.statusText).toMatch(/^6 files/);
      }
    );

    it("should name the example that the sketch is", () => {
      // Arrange
      const { bar } = renderBar();

      // Act
      const { text } = bar.picker;

      // Assert
      expect(text).toBe("Example Quick start");
    });

    it("should name another example when the sketch is that one", () => {
      // Arrange
      const other = EXAMPLES[1];
      const { bar } = renderBar(createProps(), { sketch: other.sketch });

      // Act
      const { text } = bar.picker;

      // Assert
      expect(text).toBe(`Example ${other.title}`);
    });

    it("should say Example alone once an edit makes the sketch none of them, and name the example again when the edit is undone", () => {
      // Arrange
      const { bar, store } = renderBar();

      act(() => store.changeConfig("{ settings: {}, rules: {} }"));

      const afterEdit = bar.picker.text;

      // Act
      act(() => store.changeConfig(QUICK_START_EXAMPLE.sketch.config));

      // Assert
      expect(afterEdit).toBe("Example");
      expect(bar.picker.text).toBe("Example Quick start");
    });

    it("should list every example, and mark the current one", () => {
      // Arrange
      const { bar } = renderBar();

      // Act
      bar.picker.open();

      // Assert
      expect(bar.picker.titles).toEqual(EXAMPLES.map(({ title }) => title));
      expect(bar.picker.checkedTitles).toEqual(["Quick start"]);
    });

    it("should hand the host the example that is picked and the sketch on screen, which is the edited one", async () => {
      // Arrange
      const props = createProps();
      const { bar, store } = renderBar(props);

      act(() => store.removeDependency({ path: "src/index.js", index: 0 }));
      bar.picker.open();

      // Act
      bar.picker.pick(EXAMPLES[2].title);
      await bar.picker.waitUntilClosed();

      // Assert
      expect(props.onSelectExample).toHaveBeenCalledTimes(1);
      expect(props.onSelectExample).toHaveBeenCalledWith(
        EXAMPLES[2],
        store.getState().sketch
      );
      expect(
        jest.mocked(props.onSelectExample).mock.calls[0][1].dependencies
      ).toHaveLength(QUICK_START.dependencies.length - 1);
      expect(props.onReset).not.toHaveBeenCalled();
    });
  });

  describe("reset", () => {
    it("should hand the host the sketch on screen, which is the edited one", () => {
      // Arrange
      const props = createProps();
      const { bar, store } = renderBar(props);

      act(() => store.removeNode("src/index.js"));

      // Act
      bar.actions.pressReset();

      // Assert
      expect(props.onReset).toHaveBeenCalledTimes(1);
      expect(props.onReset).toHaveBeenCalledWith(store.getState().sketch);
      expect(
        jest.mocked(props.onReset).mock.calls[0][0].tree.map(({ path }) => path)
      ).not.toContain("src/index.js");
      expect(props.onSelectExample).not.toHaveBeenCalled();
    });

    it("should be there whatever the source can edit", () => {
      // Arrange
      const { bar } = renderBar(createProps(), {
        capabilities: NO_CAPABILITIES,
      });

      // Act
      const { parts } = bar.actions;

      // Assert
      expect(parts).toEqual(["Help", "Reset"]);
    });
  });

  describe("the keyboard focus when it is first rendered", () => {
    it("should be on Reset when the host asks for it, and on nothing else", () => {
      // Arrange
      const { bar } = renderBar(createProps({ initialFocus: "reset" }));

      // Act
      const focused = [bar.actions.isResetFocused, bar.picker.isFocused];

      // Assert
      expect(focused).toEqual([true, false]);
    });

    it("should be on the picker of examples when the host asks for it, and on nothing else", () => {
      // Arrange
      const { bar } = renderBar(createProps({ initialFocus: "examples" }));

      // Act
      const focused = [bar.actions.isResetFocused, bar.picker.isFocused];

      // Assert
      expect(focused).toEqual([false, true]);
    });

    it("should be on nothing when the host does not ask", () => {
      // Arrange
      const { bar } = renderBar();

      // Act
      const focused = [bar.actions.isResetFocused, bar.picker.isFocused];

      // Assert
      expect(focused).toEqual([false, false]);
      expect(document.activeElement).toBe(document.body);
    });

    it("should be on nothing when the host asks for the picker and the source cannot offer examples, which the bar then does not have", () => {
      // Arrange
      const { bar } = renderBar(createProps({ initialFocus: "examples" }), {
        capabilities: NO_CAPABILITIES,
      });

      // Act
      const { isResetFocused } = bar.actions;

      // Assert
      expect(bar.picker.isRendered).toBe(false);
      expect(isResetFocused).toBe(false);
      expect(document.activeElement).toBe(document.body);
    });
  });

  describe("share", () => {
    it("should not be there without a way to make the link", () => {
      // Arrange
      const { bar } = renderBar(createProps({ makeLink: undefined }));

      // Act
      const { hasShare } = bar.actions;

      // Assert
      expect(hasShare).toBe(false);
      expect(bar.actions.announcement.isRendered).toBe(false);
    });

    it("should be there with a way to make the link, with its region after it", () => {
      // Arrange
      const { bar } = renderBar(
        createProps({ makeLink: () => Promise.resolve(SHORT_LINK) })
      );

      // Act
      const { parts } = bar.actions;

      // Assert
      expect(parts).toEqual(["Help", "Reset", "Share", "announcement"]);
    });

    it("should say nothing and open no dialog before it is pressed", () => {
      // Arrange
      const { bar } = renderBar(
        createProps({ makeLink: () => Promise.resolve(SHORT_LINK) })
      );

      // Act
      const share = readShare(bar);

      // Assert
      expect(share).toEqual(SHARE_AT_REST);
      expect(bar.shareDialog.isRendered).toBe(false);
    });

    it("should copy the link of the sketch on screen, which is the edited one, and confirm it on Share and in the region, with no dialog", async () => {
      // Arrange
      const writeText = stubClipboard();
      const makeLink = jest.fn((_sketch: Sketch) =>
        Promise.resolve(SHORT_LINK)
      );
      const { bar, store } = renderBar(createProps({ makeLink }));

      act(() => store.removeNode("src/index.js"));

      // Act
      await pressShare(bar);

      // Assert
      expect(makeLink).toHaveBeenCalledWith(store.getState().sketch);
      expect(writeText).toHaveBeenCalledTimes(1);
      expect(writeText).toHaveBeenCalledWith(SHORT_LINK);
      expect(readShare(bar)).toEqual(SHARE_COPIED);
      expect(bar.shareDialog.isRendered).toBe(false);
    });

    it("should confirm the copy for exactly the time of a confirmation, and then say Share again, with nothing announced", async () => {
      // Arrange
      jest.useFakeTimers();

      const { bar } = renderBar(
        createProps({ makeLink: () => Promise.resolve(SHORT_LINK) })
      );

      // Act
      await pressShare(bar);

      const shown = readShare(bar);

      pass(SHARE_COPIED_DURATION - 1);

      const justBefore = readShare(bar);

      pass(1);

      // Assert
      expect(shown).toEqual(SHARE_COPIED);
      expect(justBefore).toEqual(SHARE_COPIED);
      expect(readShare(bar)).toEqual(SHARE_AT_REST);
      expect(bar.shareDialog.isRendered).toBe(false);
    });

    it("should start the confirmation again when Share is pressed again", async () => {
      // Arrange
      jest.useFakeTimers();

      const { bar } = renderBar(
        createProps({ makeLink: () => Promise.resolve(SHORT_LINK) })
      );

      await pressShare(bar);
      pass(SHARE_COPIED_DURATION - 500);

      // Act
      await pressShare(bar);
      pass(SHARE_COPIED_DURATION - 1);

      const justBefore = readShare(bar);

      pass(1);

      // Assert
      expect(justBefore).toEqual(SHARE_COPIED);
      expect(readShare(bar)).toEqual(SHARE_AT_REST);
    });

    it("should stop the timer of the confirmation when the instance is gone", async () => {
      // Arrange
      jest.useFakeTimers();

      const setTimeoutSpy = jest.spyOn(window, "setTimeout");
      const clearTimeoutSpy = jest.spyOn(window, "clearTimeout");
      const { bar, unmount } = renderBar(
        createProps({ makeLink: () => Promise.resolve(SHORT_LINK) })
      );

      await pressShare(bar);

      const timers = findConfirmationTimers(setTimeoutSpy);

      clearTimeoutSpy.mockClear();

      // Act
      unmount();

      // Assert
      expect(timers).toHaveLength(1);
      expect(clearTimeoutSpy).toHaveBeenCalledWith(timers[0]);
    });
  });

  describe("the dialog of a share that has something to tell", () => {
    it.each(NOTICE_CASES)(
      "should open the dialog of the $kind notice with its title, and leave Share as it was",
      async (noticeCase) => {
        // Arrange
        const bar = await renderNotice(noticeCase);

        // Act
        const { shareDialog } = bar;

        // Assert
        expect(shareDialog.isRendered).toBe(true);
        expect(shareDialog.title).toBe(noticeCase.title);
        expect(shareDialog.isDialogNamed(noticeCase.title)).toBe(true);
        expect(readShare(bar)).toEqual(SHARE_AT_REST);
      }
    );

    it("should copy the link of a long one, and tell how long it is", async () => {
      // Arrange
      const writeText = stubClipboard();

      // Act
      const bar = await renderNotice(LONG_CASE);

      // Assert
      expect(writeText).toHaveBeenCalledWith(LONG_LINK);
      expect(bar.shareDialog.text).toContain(
        `${LONG_LINK.length.toLocaleString("en-US")} characters`
      );
      expect(bar.shareDialog.link.isRendered).toBe(false);
    });

    it("should ask the host for no link and copy nothing, when no link could open the sketch", async () => {
      // Arrange
      const writeText = stubClipboard();
      const makeLink = jest.fn((_sketch: Sketch) =>
        Promise.resolve(SHORT_LINK)
      );

      // Act
      const bar = await renderNotice({ ...TOO_LARGE_CASE, makeLink });

      // Assert
      expect(makeLink).not.toHaveBeenCalled();
      expect(writeText).not.toHaveBeenCalled();
      expect(bar.shareDialog.text).toContain("1,000 files and folders");
    });

    it("should give the reason of the reader of links, and copy nothing, when the sketch is refused for another cause", async () => {
      // Arrange
      const writeText = stubClipboard();
      const makeLink = jest.fn((_sketch: Sketch) =>
        Promise.resolve(SHORT_LINK)
      );

      // Act
      const bar = await renderNotice({ ...INVALID_CASE, makeLink });

      // Assert
      expect(makeLink).not.toHaveBeenCalled();
      expect(writeText).not.toHaveBeenCalled();
      expect(bar.shareDialog.reason.text).toBe(
        '"src/a.js " cannot be in the tree. A path cannot end with a space.'
      );
    });

    it.each(NOTICE_CASES)(
      "should not close the dialog of the $kind notice by itself when time passes",
      async (noticeCase) => {
        // Arrange
        jest.useFakeTimers();

        const bar = await renderNotice(noticeCase);

        // Act
        pass(A_MINUTE);
        pass(TIME_TO_BE_GONE);

        // Assert
        expect(bar.shareDialog.isRendered).toBe(true);
        expect(bar.shareDialog.title).toBe(noticeCase.title);
      }
    );

    it.each<[string, NoticeCase, (bar: ShellTopBarPom) => void]>([
      [
        "Got it",
        NOT_MADE_CASE,
        (bar) => bar.shareDialog.button("Got it").press(),
      ],
      [
        "Close",
        NOT_COPIED_CASE,
        (bar) => bar.shareDialog.button("Close").press(),
      ],
      ["the Escape key", NOT_MADE_CASE, (bar) => bar.shareDialog.pressEscape()],
      [
        "a click outside it",
        NOT_MADE_CASE,
        (bar) => bar.shareDialog.clickBackdrop(),
      ],
    ])(
      "should close with %s, and give the keyboard focus back to Share once it is gone",
      async (_how, noticeCase, closeDialog) => {
        // Arrange
        const bar = await renderNotice(noticeCase);
        const focusedWhileOpen = bar.actions.share.isFocused;

        // Act
        closeDialog(bar);
        await bar.shareDialog.waitUntilGone();

        // Assert
        expect(focusedWhileOpen).toBe(false);
        expect(bar.actions.share.isFocused).toBe(true);
      }
    );

    it("should confirm a plain copy on Share, with no dialog, when it is pressed after a notice was closed", async () => {
      // Arrange
      const bar = await renderNotice(NOT_COPIED_CASE);

      bar.shareDialog.button("Close").press();
      await bar.shareDialog.waitUntilGone();
      stubClipboard();

      // Act
      await pressShare(bar);

      // Assert
      expect(readShare(bar)).toEqual(SHARE_COPIED);
      expect(bar.shareDialog.isRendered).toBe(false);
    });

    it("should open the dialog again with the title of the notice of a later share", async () => {
      // Arrange
      const makeLink = jest
        .fn<ReturnType<MakeLink>, Parameters<MakeLink>>()
        .mockRejectedValueOnce(new Error("no link"))
        .mockResolvedValue(LONG_LINK);
      const { bar } = renderBar(createProps({ makeLink }));

      await pressShare(bar);

      const firstTitle = bar.shareDialog.title;

      bar.shareDialog.button("Got it").press();
      await bar.shareDialog.waitUntilGone();

      // Act
      await pressShare(bar);

      // Assert
      expect(firstTitle).toBe("The link could not be made");
      expect(bar.shareDialog.isRendered).toBe(true);
      expect(bar.shareDialog.title).toBe("Long link copied");
    });
  });

  describe("the dialog of a link that could not be copied", () => {
    it("should show the link in a field, with Close and Copy link, and say Copy link before the user presses it", async () => {
      // Arrange
      const bar = await renderNotice(NOT_COPIED_CASE);

      // Act
      const { shareDialog } = bar;

      // Assert
      expect(shareDialog.link.value).toBe(SHORT_LINK);
      expect(shareDialog.buttonNames).toEqual(["Close", "Copy link"]);
      expect(shareDialog.copyButton.isShowingLabel).toBe(true);
      expect(shareDialog.announcement.text).toBe("");
    });

    it("should copy the same link when Copy link is pressed with a working clipboard, and confirm it on the button and in the region of the dialog", async () => {
      // Arrange
      const bar = await renderNotice(NOT_COPIED_CASE);
      const writeText = stubClipboard();

      // Act
      await act(async () => {
        bar.shareDialog.copyButton.press();
      });

      // Assert
      expect(writeText).toHaveBeenCalledTimes(1);
      expect(writeText).toHaveBeenCalledWith(SHORT_LINK);
      expect(readCopyAgain(bar)).toEqual({
        visibleText: "Copied",
        isShowingCopied: true,
        announced: "Link copied",
      });
      expect(readShare(bar)).toEqual(SHARE_AT_REST);
      expect(bar.shareDialog.isRendered).toBe(true);
    });

    it("should confirm the copy for exactly the time of a confirmation, and then say Copy link again, with nothing announced", async () => {
      // Arrange
      jest.useFakeTimers();

      const bar = await renderNotice(NOT_COPIED_CASE);

      stubClipboard();
      await act(async () => {
        bar.shareDialog.copyButton.press();
      });

      const shown = bar.shareDialog.announcement.text;

      pass(SHARE_COPIED_DURATION - 1);

      const justBefore = bar.shareDialog.copyButton.isShowingCopied;

      // Act
      pass(1);

      // Assert
      expect(shown).toBe("Link copied");
      expect(justBefore).toBe(true);
      expect(bar.shareDialog.copyButton.isShowingLabel).toBe(true);
      expect(bar.shareDialog.copyButton.visibleText).toBe("Copy link");
      expect(bar.shareDialog.announcement.text).toBe("");
    });

    it("should not confirm anything when the clipboard refuses the link again", async () => {
      // Arrange
      const bar = await renderNotice(NOT_COPIED_CASE);

      // Act
      await act(async () => {
        bar.shareDialog.copyButton.press();
      });

      // Assert
      expect(bar.shareDialog.copyButton.isShowingLabel).toBe(true);
      expect(bar.shareDialog.announcement.text).toBe("");
      expect(bar.shareDialog.isRendered).toBe(true);
    });
  });

  describe("help", () => {
    it("should not be open by itself, and not look pressed", () => {
      // Arrange
      const { bar } = renderBar();

      // Act
      const { isRendered } = bar.help;
      const { isHelpPressed } = bar.actions;

      // Assert
      expect(isRendered).toBe(false);
      expect(isHelpPressed).toBe(false);
    });

    it("should open when Help is pressed, and look pressed while it is open", () => {
      // Arrange
      const { bar } = renderBar();

      // Act
      bar.actions.pressHelp();

      // Assert
      expect(bar.help.isRendered).toBe(true);
      expect(bar.help.title).toBe("How the playground works");
      expect(bar.actions.isHelpPressed).toBe(true);
    });

    it("should link to the Quick start when the host gives its URL", () => {
      // Arrange
      const { bar } = renderBar(
        createProps({ quickStartUrl: "/docs/quick-start" })
      );

      // Act
      bar.actions.pressHelp();

      // Assert
      expect(bar.help.quickStartLink.isRendered).toBe(true);
      expect(bar.help.quickStartLink.href).toBe("/docs/quick-start");
      expect(bar.help.playgroundGuideLink.isRendered).toBe(false);
    });

    it("should link to the playground guide when the host gives its URL", () => {
      // Arrange
      const { bar } = renderBar(
        createProps({ guideUrl: "/docs/guides/playground" })
      );

      // Act
      bar.actions.pressHelp();

      // Assert
      expect(bar.help.playgroundGuideLink.isRendered).toBe(true);
      expect(bar.help.playgroundGuideLink.href).toBe("/docs/guides/playground");
      expect(bar.help.quickStartLink.isRendered).toBe(false);
    });

    it("should link to the playground guide and to the Quick start when the host gives both URLs", () => {
      // Arrange
      const { bar } = renderBar(
        createProps({
          guideUrl: "/docs/guides/playground",
          quickStartUrl: "/docs/quick-start",
        })
      );

      // Act
      bar.actions.pressHelp();

      // Assert
      expect(bar.help.playgroundGuideLink.href).toBe("/docs/guides/playground");
      expect(bar.help.quickStartLink.href).toBe("/docs/quick-start");
    });

    it("should draw no link without the URL of the playground guide and the one of the Quick start", () => {
      // Arrange
      const { bar } = renderBar();

      // Act
      bar.actions.pressHelp();

      // Assert
      expect(bar.help.playgroundGuideLink.isRendered).toBe(false);
      expect(bar.help.quickStartLink.isRendered).toBe(false);
    });

    it("should close with the button of the dialog, and give the keyboard focus back to Help", async () => {
      // Arrange
      const { bar } = renderBar();

      bar.actions.pressHelp();

      // Act
      bar.help.close();
      await bar.help.waitUntilGone();

      // Assert
      expect(bar.actions.isHelpPressed).toBe(false);
      expect(bar.actions.isHelpFocused).toBe(true);
    });

    it("should close with the Escape key, and give the keyboard focus back to Help", async () => {
      // Arrange
      const { bar } = renderBar();

      bar.actions.pressHelp();

      // Act
      bar.help.pressEscape();
      await bar.help.waitUntilGone();

      // Assert
      expect(bar.actions.isHelpPressed).toBe(false);
      expect(bar.actions.isHelpFocused).toBe(true);
    });

    it("should close with a click outside it, and give the keyboard focus back to Help", async () => {
      // Arrange
      const { bar } = renderBar();

      bar.actions.pressHelp();

      // Act
      bar.help.clickBackdrop();
      await bar.help.waitUntilGone();

      // Assert
      expect(bar.actions.isHelpFocused).toBe(true);
    });

    it("should open again after it closed", async () => {
      // Arrange
      const { bar } = renderBar();

      bar.actions.pressHelp();
      bar.help.close();
      await bar.help.waitUntilGone();

      // Act
      bar.actions.pressHelp();

      // Assert
      expect(bar.help.isRendered).toBe(true);
    });
  });
});
