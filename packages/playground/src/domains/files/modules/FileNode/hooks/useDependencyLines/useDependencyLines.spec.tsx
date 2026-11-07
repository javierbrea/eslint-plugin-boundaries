import { act, renderHook } from "@testing-library/react";
import { useState } from "react";

import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import type { getDependencyLines } from "@/domains/files/ui/helpers/dependencyLines";
import {
  renderHookInSession,
  waitForEvaluation,
} from "@/domains/session/data/store/store.mock";

import { useDependencyLines } from "./useDependencyLines";

const QUICK_START = QUICK_START_EXAMPLE.sketch;

const CHECKOUT = "src/modules/checkout/index.js";

const FORMAT = "src/helpers/format/index.js";

const STYLE = "src/components/atoms/Button/Button.css";

/** The quick-start config whose module policy no longer allows components: the same lines, and the first one reads otherwise. */
const MODULES_WITHOUT_COMPONENTS = QUICK_START.config.replace(
  'types: ["component", "helper"]',
  'types: ["helper"]'
);

/**
 * Reads what the lines of a file say.
 * @param lines The lines.
 * @returns The statement and the verdict of each line, in order.
 */
function readLines(
  lines: readonly {
    readonly tokens: readonly { readonly text: string }[];
    readonly label: string;
  }[]
): string[] {
  return lines.map(
    ({ tokens, label }) => `${tokens.map(({ text }) => text).join("")} ${label}`
  );
}

describe("useDependencyLines", () => {
  let spy: jest.SpiedFunction<typeof getDependencyLines>;

  beforeEach(() => {
    jest.useFakeTimers();
    // The hook reads the function from the module each time it builds the lines
    spy = jest.spyOn(
      jest.requireActual<{ getDependencyLines: typeof getDependencyLines }>(
        "@/domains/files/ui/helpers/dependencyLines/dependencyLines"
      ),
      "getDependencyLines"
    );
  });

  afterEach(() => {
    spy.mockRestore();
    jest.useRealTimers();
  });

  describe("outside the provider", () => {
    beforeEach(() => {
      // React logs the error that a component throws
      jest.spyOn(console, "error").mockReturnValue(undefined);
    });

    afterEach(() => {
      jest.mocked(console.error).mockRestore();
    });

    it("should throw when it is used in a pane outside SessionProvider", () => {
      // Act
      const render = (): unknown =>
        renderHook(() => useDependencyLines(CHECKOUT));

      // Assert
      expect(render).toThrow("outside SessionProvider");
    });
  });

  it("should give the dependencies of the file as statements with their verdicts, in order", () => {
    // Act
    const { result } = renderHookInSession(
      () => useDependencyLines(CHECKOUT),
      QUICK_START
    );

    // Assert
    expect(readLines(result.current)).toEqual([
      'import { Button } from "../../components/atoms/Button/index.js"; policy 1',
      'import { format } from "../../helpers/format/index.js"; policy 1',
      'import { renderButton } from "../../components/atoms/Button/Button.spec.js"; policy 2',
      'import React from "react"; not checked · external',
    ]);
  });

  it("should give no lines for a file without dependencies", () => {
    // Act
    const { result } = renderHookInSession(
      () => useDependencyLines(STYLE),
      QUICK_START
    );

    // Assert
    expect(result.current).toEqual([]);
  });

  it("should give the lines of the file again after a dependency is removed", () => {
    // Arrange
    const { result, store } = renderHookInSession(
      () => useDependencyLines(CHECKOUT),
      QUICK_START
    );

    // Act
    act(() => store.removeDependency({ path: CHECKOUT, index: 2 }));

    // Assert
    expect(readLines(result.current)).toEqual([
      'import { Button } from "../../components/atoms/Button/index.js"; policy 1',
      'import { format } from "../../helpers/format/index.js"; policy 1',
      'import React from "react"; not checked · external',
    ]);
  });

  it("should give the same array while the store changes in a way that leaves the verdicts as they were", () => {
    // Arrange
    const { results, store } = renderHookInSession(
      () => useDependencyLines(CHECKOUT),
      QUICK_START
    );

    // Act
    act(() => store.open({ kind: "dependency", path: CHECKOUT, index: 0 }));
    act(() => store.selectTab("sketch"));

    // Assert
    expect(results).toHaveLength(1);
  });

  it("should not build the lines again while the store changes with the same verdicts", () => {
    // Arrange
    const { store } = renderHookInSession(
      () => useDependencyLines(CHECKOUT),
      QUICK_START
    );
    const built = spy.mock.calls.length;

    // Act
    act(() => store.open({ kind: "dependency", path: CHECKOUT, index: 0 }));
    act(() => store.selectTab("sketch"));

    // Assert
    expect(spy).toHaveBeenCalledTimes(built);
  });

  it("should give the same array after an evaluation whose verdicts read the same", () => {
    // Arrange
    const { results, store } = renderHookInSession(
      () => useDependencyLines(CHECKOUT),
      QUICK_START
    );

    // Act
    act(() => store.changeConfig(`${QUICK_START.config}\n`));
    waitForEvaluation();

    // Assert
    expect(results).toHaveLength(1);
  });

  it("should give the same array when an edit of another file leaves the file as it was", () => {
    // Arrange
    const { results, store } = renderHookInSession(
      () => useDependencyLines(CHECKOUT),
      QUICK_START
    );

    // Act
    act(() => store.removeDependency({ path: FORMAT, index: 0 }));

    // Assert
    expect(results).toHaveLength(1);
  });

  it("should give a new array when a verdict changes", () => {
    // Arrange
    const { results, result, store } = renderHookInSession(
      () => useDependencyLines(CHECKOUT),
      QUICK_START
    );
    const before = result.current;

    // Act
    act(() => store.changeConfig(MODULES_WITHOUT_COMPONENTS));
    waitForEvaluation();

    // Assert
    expect(results).toHaveLength(2);
    expect(result.current).not.toBe(before);
    expect(readLines(result.current)).toEqual([
      'import { Button } from "../../components/atoms/Button/index.js"; default',
      'import { format } from "../../helpers/format/index.js"; policy 1',
      'import { renderButton } from "../../components/atoms/Button/Button.spec.js"; policy 2',
      'import React from "react"; not checked · external',
    ]);
  });

  it("should give the lines of the other file when the path changes, and the same empty array between files that have none", () => {
    // Arrange
    const { results, result } = renderHookInSession(() => {
      const [path, setPath] = useState(STYLE);

      return { lines: useDependencyLines(path), setPath };
    }, QUICK_START);

    // Act
    act(() => result.current.setPath(FORMAT));
    const format = result.current.lines;
    act(() => result.current.setPath(CHECKOUT));

    // Assert
    expect(results[0].lines).toEqual([]);
    expect(readLines(format)).toEqual([
      'import { Button } from "../../components/atoms/Button/index.js"; default',
    ]);
    expect(readLines(result.current.lines)).toHaveLength(4);
  });

  it("should give the same empty array for two files that have no dependencies", () => {
    // Arrange
    const { results, result } = renderHookInSession(() => {
      const [path, setPath] = useState(STYLE);

      return { lines: useDependencyLines(path), setPath };
    }, QUICK_START);

    // Act
    act(() => result.current.setPath("src/components/atoms/Button/other.js"));

    // Assert
    expect(results).toHaveLength(2);
    expect(results[1].lines).toBe(results[0].lines);
  });
});
