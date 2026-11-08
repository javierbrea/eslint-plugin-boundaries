import { act } from "@testing-library/react";

import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import { EVALUATION_DELAY } from "@/domains/session/data/store";
import { renderInSession } from "@/domains/session/data/store/store.mock";

import { ShellTopBar } from "./ShellTopBar";
import { ShellTopBarPom } from "./ShellTopBar.pom";

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

describe("ShellTopBar", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("should say how many files and dependencies the sketch has", () => {
    // Arrange
    renderInSession(<ShellTopBar />, { sketch: QUICK_START });
    const bar = new ShellTopBarPom();

    // Act
    const counts = readCounts(bar);

    // Assert
    expect(counts).toEqual(["6 files", "9 dependencies"]);
  });

  it("should count the dependencies again at once when one is removed", () => {
    // Arrange
    const { store } = renderInSession(<ShellTopBar />, { sketch: QUICK_START });
    const bar = new ShellTopBarPom();

    // Act
    act(() => store.removeDependency({ path: "src/index.js", index: 0 }));

    // Assert
    expect(readCounts(bar)).toEqual(["6 files", "8 dependencies"]);
  });

  it("should say one dependency in the singular", () => {
    // Arrange
    const { store } = renderInSession(<ShellTopBar />, {
      sketch: { ...QUICK_START, dependencies: [] },
    });
    const bar = new ShellTopBarPom();

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
    renderInSession(<ShellTopBar />, {
      sketch: { ...QUICK_START, dependencies: [] },
    });
    const bar = new ShellTopBarPom();

    // Act
    const counts = readCounts(bar);

    // Assert
    expect(counts).toEqual(["6 files", "0 dependencies"]);
  });

  it("should keep the dependencies in the status while the config has errors", () => {
    // Arrange
    jest.useFakeTimers();
    const { store } = renderInSession(<ShellTopBar />, { sketch: QUICK_START });
    const bar = new ShellTopBarPom();

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
});
