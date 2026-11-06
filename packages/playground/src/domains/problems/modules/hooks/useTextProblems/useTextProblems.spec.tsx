import { act, renderHook } from "@testing-library/react";

import type { Sketch } from "@/contract";
import type { TextProblem } from "@/domains/project/helpers/sketch";
import { useFocus } from "@/domains/session/data/store";
import type { SessionStore } from "@/domains/session/data/store";
import {
  ALL_CAPABILITIES,
  HOOK_SKETCH,
  renderHookInSession,
  renderInSession,
  waitForEvaluation,
} from "@/domains/session/data/store/store.mock";

import { useTextProblems } from "./useTextProblems";

// A dependency line of text mode that no file of the sketch answers
const UNREADABLE_LINE = "  import { a } from './b'";

describe("useTextProblems", () => {
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
      const render = (): unknown => renderHook(useTextProblems);

      // Assert
      expect(render).toThrow("outside SessionProvider");
    });
  });

  it("should give no problems without a draft", () => {
    // Act
    const { result } = renderHookInSession(useTextProblems);

    // Assert
    expect(result.current).toEqual([]);
  });

  it("should give the lines of the draft that cannot be read", () => {
    // Arrange
    const { store, result } = renderHookInSession(useTextProblems);

    act(() => store.setView("text"));

    // Act
    act(() => store.setTextDraft(`main.js\n${UNREADABLE_LINE}\n`));

    // Assert
    expect(result.current).toEqual([
      {
        line: 2,
        text: UNREADABLE_LINE,
        reason:
          '"./b" does not resolve to a file of the sketch: the "node" resolver finds none.',
      },
    ]);
  });

  describe("with the resolvers of the config", () => {
    const TYPESCRIPT_SKETCH: Sketch = {
      config: '{ settings: { "import/resolver": "typescript" }, rules: {} }',
      tree: [
        { path: "src/a.ts", kind: "file" },
        { path: "src/b.ts", kind: "file" },
      ],
      dependencies: [],
    };

    const TYPED = 'src/a.ts\n  import "./b";\nsrc/b.ts\n';

    it("should read the sources of the draft with them", () => {
      // Arrange
      const { store, result } = renderHookInSession(
        useTextProblems,
        TYPESCRIPT_SKETCH
      );

      act(() => store.setView("text"));

      // Act
      act(() => store.setTextDraft(TYPED));

      // Assert
      expect(result.current).toEqual([]);
    });

    it("should read them with the node resolver while the config sets none", () => {
      // Arrange
      const { store, result } = renderHookInSession(useTextProblems, {
        ...TYPESCRIPT_SKETCH,
        config: "{ settings: {}, rules: {} }",
      });

      act(() => store.setView("text"));

      // Act
      act(() => store.setTextDraft(TYPED));

      // Assert
      expect(result.current).toEqual([
        {
          line: 2,
          text: '  import "./b";',
          reason:
            '"./b" does not resolve to a file of the sketch: the "node" resolver finds none.',
        },
      ]);
    });

    describe("when the config changes the resolvers", () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it("should read the draft again with them", () => {
        // Arrange
        const { store, result } = renderHookInSession(useTextProblems, {
          ...TYPESCRIPT_SKETCH,
          config: "{ settings: {}, rules: {} }",
        });

        act(() => store.setView("text"));
        act(() => store.setTextDraft(TYPED));

        // Act
        act(() => store.changeConfig(TYPESCRIPT_SKETCH.config));
        waitForEvaluation();

        // Assert
        expect(result.current).toEqual([]);
      });
    });
  });

  it("should give the same array while the draft does not change", () => {
    // Arrange
    const { store, results } = renderHookInSession(() => ({
      problems: useTextProblems(),
      focus: useFocus(),
    }));

    act(() => store.setView("text"));
    act(() => store.setTextDraft(`${UNREADABLE_LINE}\n`));

    // Act
    act(() => store.open({ kind: "config" }));

    // Assert
    const [last, previous] = [results.at(-1), results.at(-2)];

    expect(last?.focus).toEqual({ kind: "config" });
    expect(last?.problems).toBe(previous?.problems);
  });

  it("should give the same empty array each time there is no draft", () => {
    // Arrange
    const { store, results } = renderHookInSession(() => ({
      problems: useTextProblems(),
      focus: useFocus(),
    }));

    // Act
    act(() => store.open({ kind: "config" }));

    // Assert
    expect(results[1].problems).toBe(results[0].problems);
  });

  it("should give no problems again when the draft is dropped", () => {
    // Arrange
    const { store, result } = renderHookInSession(useTextProblems);

    act(() => store.setView("text"));
    act(() => store.setTextDraft(`${UNREADABLE_LINE}\n`));

    // Act
    act(() => store.setView("tree"));

    // Assert
    expect(result.current).toEqual([]);
  });

  describe("without editDependencies", () => {
    /**
     * Renders the hook in a session whose host does not let the user edit dependencies.
     * @returns The store, and a holder of what the hook returned in its last render.
     */
    function renderWithoutDependencyEdits(): {
      store: SessionStore;
      read: { problems: readonly TextProblem[] };
    } {
      const read: { problems: readonly TextProblem[] } = { problems: [] };

      /**
       * Calls the hook in a component and remembers what it returned.
       * @returns Nothing to render.
       */
      function Probe(): null {
        read.problems = useTextProblems();
        return null;
      }

      const { store } = renderInSession(<Probe />, {
        sketch: HOOK_SKETCH,
        capabilities: { ...ALL_CAPABILITIES, editDependencies: false },
      });

      return { store, read };
    }

    it("should give no problems for the dependency lines of the draft, which text mode ignores", () => {
      // Arrange
      const { store, read } = renderWithoutDependencyEdits();

      act(() => store.setView("text"));

      // Act
      act(() =>
        store.setTextDraft(`main.js\n${UNREADABLE_LINE}\n  import bad\n`)
      );

      // Assert
      expect(read.problems).toEqual([]);
    });

    it("should give the lines of nodes that cannot be read", () => {
      // Arrange
      const { store, read } = renderWithoutDependencyEdits();

      act(() => store.setView("text"));

      // Act
      act(() => store.setTextDraft(`main.js\n${UNREADABLE_LINE}\nmain.js\n`));

      // Assert
      expect(read.problems).toEqual([
        { line: 3, text: "main.js", reason: "That path already exists." },
      ]);
    });
  });
});
