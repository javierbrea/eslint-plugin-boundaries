import { act } from "@testing-library/react";

import type { ProjectCapabilities, Sketch } from "@/contract";
import {
  EXAMPLES,
  QUICK_START_EXAMPLE,
} from "@/domains/examples/data/examples";
import { EVALUATION_DELAY } from "@/domains/session/data/store";
import {
  ALL_CAPABILITIES,
  NO_CAPABILITIES,
  renderInSession,
} from "@/domains/session/data/store/store.mock";
import { LONG_LINK_LENGTH } from "@/domains/share/helpers/sketchHash";
import {
  SHARE_COPIED_DURATION,
  SHARE_LONG_DURATION,
} from "@/domains/share/modules/hooks/useShareLink";
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
 * Finds the timers that keep the message of a link that was copied, among the ones the window was asked to start.
 * @param setTimeoutSpy The spy of `window.setTimeout`.
 * @returns The ids of the timers that last as long as that message.
 */
function findMessageTimers(
  setTimeoutSpy: jest.SpyInstance<number, Parameters<typeof setTimeout>>
): number[] {
  return setTimeoutSpy.mock.calls.flatMap(([, delay], index) =>
    delay === SHARE_COPIED_DURATION
      ? [setTimeoutSpy.mock.results[index].value as number]
      : []
  );
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

  describe("share", () => {
    it("should not be there without a way to make the link", () => {
      // Arrange
      const { bar } = renderBar(createProps({ makeLink: undefined }));

      // Act
      const { hasShare } = bar.actions;

      // Assert
      expect(hasShare).toBe(false);
      expect(bar.actions.message.isRendered).toBe(false);
    });

    it("should be there with a way to make the link, with its message before Help", () => {
      // Arrange
      const { bar } = renderBar(
        createProps({ makeLink: () => Promise.resolve(SHORT_LINK) })
      );

      // Act
      const { parts } = bar.actions;

      // Assert
      expect(parts).toEqual(["message", "Help", "Reset", "Share"]);
    });

    it("should copy the link of the sketch on screen, which is the edited one, and say so", async () => {
      // Arrange
      const writeText = stubClipboard();
      const makeLink = jest.fn((_sketch: Sketch) =>
        Promise.resolve(SHORT_LINK)
      );
      const { bar, store } = renderBar(createProps({ makeLink }));

      act(() => store.removeNode("src/index.js"));

      // Act
      await act(async () => {
        bar.actions.pressShare();
      });

      // Assert
      expect(makeLink).toHaveBeenCalledWith(store.getState().sketch);
      expect(writeText).toHaveBeenCalledWith(SHORT_LINK);
      expect(bar.actions.message.text).toBe("Link copied");
      expect(bar.actions.message.color).toBe("var(--jsb-muted)");
      expect(bar.actions.message.checkColor).toBe("var(--jsb-ok)");
    });

    it("should say that a long link is long, in the color of warnings", async () => {
      // Arrange
      const { bar } = renderBar(
        createProps({ makeLink: () => Promise.resolve(LONG_LINK) })
      );

      // Act
      await act(async () => {
        bar.actions.pressShare();
      });

      // Assert
      expect(bar.actions.message.text).toBe(
        "Long link copied: some apps may cut it"
      );
      expect(bar.actions.message.color).toBe(
        "color-mix(in srgb, var(--jsb-warn) 85%, var(--jsb-ink))"
      );
    });

    it("should say that the link could not be copied when the store cannot make it, in the color of errors", async () => {
      // Arrange
      const { bar } = renderBar(
        createProps({ makeLink: () => Promise.reject(new Error("no link")) })
      );

      // Act
      await act(async () => {
        bar.actions.pressShare();
      });

      // Assert
      expect(bar.actions.message.text).toBe("The link could not be copied");
      expect(bar.actions.message.color).toBe(
        "color-mix(in srgb, var(--jsb-bad) 85%, var(--jsb-ink))"
      );
    });

    it("should say that the link could not be copied when the clipboard refuses it", async () => {
      // Arrange
      stubClipboard(() => Promise.reject(new Error("denied")));

      const { bar } = renderBar(
        createProps({ makeLink: () => Promise.resolve(SHORT_LINK) })
      );

      // Act
      await act(async () => {
        bar.actions.pressShare();
      });

      // Assert
      expect(bar.actions.message.text).toBe("The link could not be copied");
    });

    it.each<[string, string, number, string]>([
      ["short", SHORT_LINK, SHARE_COPIED_DURATION, "Link copied"],
      [
        "long",
        LONG_LINK,
        SHARE_LONG_DURATION,
        "Long link copied: some apps may cut it",
      ],
    ])(
      "should keep the message of a %s link for its time, and then say nothing",
      async (_name, link, duration, text) => {
        // Arrange
        jest.useFakeTimers();

        const { bar } = renderBar(
          createProps({ makeLink: () => Promise.resolve(link) })
        );

        // Act
        await act(async () => {
          bar.actions.pressShare();
        });

        const shown = bar.actions.message.text;

        act(() => {
          jest.advanceTimersByTime(duration - 1);
        });

        const justBefore = bar.actions.message.text;

        act(() => {
          jest.advanceTimersByTime(1);
        });

        // Assert
        expect(shown).toBe(text);
        expect(justBefore).toBe(text);
        expect(bar.actions.message.text).toBe("");
      }
    );

    it("should start the message again when it is pressed again", async () => {
      // Arrange
      jest.useFakeTimers();

      const { bar } = renderBar(
        createProps({ makeLink: () => Promise.resolve(SHORT_LINK) })
      );

      await act(async () => {
        bar.actions.pressShare();
      });
      act(() => {
        jest.advanceTimersByTime(SHARE_COPIED_DURATION - 500);
      });

      // Act
      await act(async () => {
        bar.actions.pressShare();
      });
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Assert
      expect(bar.actions.message.text).toBe("Link copied");
    });

    it("should stop the timer of the message when the instance is gone", async () => {
      // Arrange
      jest.useFakeTimers();

      const setTimeoutSpy = jest.spyOn(window, "setTimeout");
      const clearTimeoutSpy = jest.spyOn(window, "clearTimeout");
      const { bar, unmount } = renderBar(
        createProps({ makeLink: () => Promise.resolve(SHORT_LINK) })
      );

      await act(async () => {
        bar.actions.pressShare();
      });

      const timers = findMessageTimers(setTimeoutSpy);

      // Act
      unmount();

      // Assert
      expect(timers).toHaveLength(1);
      expect(clearTimeoutSpy).toHaveBeenCalledWith(timers[0]);
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
      expect(bar.help.hasGuideLink).toBe(true);
      expect(bar.help.guideLinkHref).toBe("/docs/quick-start");
    });

    it("should draw no link without the URL of the Quick start", () => {
      // Arrange
      const { bar } = renderBar();

      // Act
      bar.actions.pressHelp();

      // Assert
      expect(bar.help.hasGuideLink).toBe(false);
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
