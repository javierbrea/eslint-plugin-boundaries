import { act, render, screen as view } from "@testing-library/react";
import type { ReactNode, RefObject } from "react";

import type { ProjectCapabilities, Sketch } from "../../contract";
import { createEngine } from "../../engine";
import type { Engine } from "../../engine";

import {
  ALL_CAPABILITIES,
  NO_CAPABILITIES,
} from "./__fixtures__/RenderInWorkbench";
import {
  useCapabilities,
  useConfigEditorSnapshot,
  useTree,
  useWorkbenchStore,
} from "./Hooks";
import { EVALUATION_DELAY } from "./Store";
import type { WorkbenchStore } from "./Store.types";
import { WorkbenchProvider } from "./WorkbenchProvider";
import type { ConfigEditorSnapshot } from "./WorkbenchProvider.types";

// The real engines, whose evaluations the tests only count
jest.mock<{ createEngine: typeof createEngine }>("../../engine", () => {
  const actual = jest.requireActual<{ createEngine: typeof createEngine }>(
    "../../engine"
  );
  return {
    ...actual,
    createEngine: jest.fn(() => {
      const engine = actual.createEngine();
      return { evaluate: jest.fn(engine.evaluate) };
    }),
  };
});

/**
 * Gets the `evaluate` of the engine that the provider created.
 * @returns The `evaluate` of the first engine created since the test began, which counts its calls.
 */
function getEvaluate(): jest.MockedFunction<Engine["evaluate"]> {
  return jest.mocked(jest.mocked(createEngine).mock.results[0].value.evaluate);
}

const SKETCH: Sketch = {
  config: "{ settings: {}, rules: {} }",
  tree: [{ path: "src/index.js", kind: "file" }],
  dependencies: [],
};

const OTHER_SKETCH: Sketch = {
  ...SKETCH,
  tree: [{ path: "main.js", kind: "file" }],
};

/** What the pane of the spec saw in each of its renders. */
type Seen = {
  stores: WorkbenchStore[];
  capabilities: ProjectCapabilities[];
  snapshots: RefObject<ConfigEditorSnapshot | undefined>[];
};

/** Props of {@link Pane}. */
type PaneProps = {
  /** Where the pane writes what it reads. */
  seen: Seen;
};

/**
 * A pane that shows how many nodes the tree has and remembers what it read from the provider.
 * @param props Pane props.
 * @param props.seen Where to write what it reads.
 * @returns The count of nodes.
 */
function Pane({ seen }: Readonly<PaneProps>): ReactNode {
  seen.stores.push(useWorkbenchStore());
  seen.capabilities.push(useCapabilities());
  seen.snapshots.push(useConfigEditorSnapshot());

  return <output>{useTree().length}</output>;
}

/** What {@link renderProvider} returns. */
type Rendered = {
  /** What the pane saw in each render. */
  seen: Seen;
  /** The store that the provider created. */
  store: WorkbenchStore;
  /** Renders the provider again with other props. */
  update: (props: Partial<ProviderProps>) => void;
  /** Unmounts the provider. */
  unmount: () => void;
};

/** The props of the provider that a spec changes. */
type ProviderProps = {
  initialSketch: Sketch;
  capabilities: ProjectCapabilities;
  onSketchChange: (sketch: Sketch) => void;
};

/**
 * Renders a provider with a pane inside.
 * @param initial The props to start from; the sketch, everything editable and no callback when they are unset.
 * @returns The handles of the render.
 */
function renderProvider(initial: Partial<ProviderProps> = {}): Rendered {
  const seen: Seen = { stores: [], capabilities: [], snapshots: [] };
  const defaults: ProviderProps = {
    initialSketch: SKETCH,
    capabilities: ALL_CAPABILITIES,
    onSketchChange: jest.fn(),
  };

  /**
   * Builds the provider with the pane.
   * @param props The props that differ from the defaults.
   * @returns The element.
   */
  const ui = (props: Partial<ProviderProps>): ReactNode => (
    <WorkbenchProvider {...defaults} {...props}>
      <Pane seen={seen} />
    </WorkbenchProvider>
  );
  const { rerender, unmount } = render(ui(initial));

  return {
    seen,
    // The pane renders with the provider, so there is a store once `render` returns
    store: seen.stores[0],
    update: (props) => rerender(ui({ ...initial, ...props })),
    unmount,
  };
}

describe("WorkbenchProvider", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("children", () => {
    it("should render the panes", () => {
      // Act
      renderProvider();

      // Assert
      expect(view.getByRole("status").textContent).toBe("1");
    });

    it("should render the panes again when the sketch changes", () => {
      // Arrange
      const { store } = renderProvider();

      // Act
      act(() => store.addNode("file"));

      // Assert
      expect(view.getByRole("status").textContent).toBe("2");
    });
  });

  describe("store", () => {
    it("should start from the sketch", () => {
      // Act
      const { store } = renderProvider();

      // Assert
      expect(store.getState().sketch).toBe(SKETCH);
    });

    it("should keep the sketch it started from when a later one is passed", () => {
      // Arrange
      const { store, update } = renderProvider();

      // Act
      update({ initialSketch: OTHER_SKETCH });

      // Assert
      expect(store.getState().sketch).toBe(SKETCH);
      expect(view.getByRole("status").textContent).toBe("1");
    });

    it("should give the same store on every render", () => {
      // Arrange
      const { seen, store, update } = renderProvider();

      // Act
      act(() => store.addNode("file"));
      update({ capabilities: NO_CAPABILITIES });

      // Assert
      expect(seen.stores.length).toBeGreaterThan(1);
      expect(new Set(seen.stores).size).toBe(1);
    });

    it("should give each provider a store of its own", () => {
      // Act
      const first = renderProvider();
      const second = renderProvider();

      // Assert
      expect(first.store).not.toBe(second.store);
    });
  });

  describe("capabilities", () => {
    it("should give the capabilities of the host", () => {
      // Act
      const { seen } = renderProvider({ capabilities: NO_CAPABILITIES });

      // Assert
      expect(seen.capabilities[0]).toBe(NO_CAPABILITIES);
    });

    it("should give the new capabilities when the host changes them", () => {
      // Arrange
      const { seen, update } = renderProvider();

      // Act
      update({ capabilities: NO_CAPABILITIES });

      // Assert
      expect(seen.capabilities.at(-1)).toBe(NO_CAPABILITIES);
    });
  });

  describe("config editor snapshot", () => {
    it("should give a ref that holds nothing at first", () => {
      // Act
      const { seen } = renderProvider();

      // Assert
      expect(seen.snapshots[0].current).toBeUndefined();
    });

    it("should give the same ref on every render, with what was left in it", () => {
      // Arrange
      const { seen, store, update } = renderProvider();
      const snapshot = {} as unknown as ConfigEditorSnapshot;

      seen.snapshots[0].current = snapshot;

      // Act
      act(() => store.addNode("file"));
      update({ capabilities: NO_CAPABILITIES });

      // Assert
      expect(new Set(seen.snapshots).size).toBe(1);
      expect(seen.snapshots.at(-1)?.current).toBe(snapshot);
    });
  });

  describe("onSketchChange", () => {
    it("should not report the sketch it started from", () => {
      // Arrange
      const onSketchChange = jest.fn();

      // Act
      renderProvider({ onSketchChange });

      // Assert
      expect(onSketchChange).not.toHaveBeenCalled();
    });

    it("should report the sketch that an edit of the tree makes, once", () => {
      // Arrange
      const onSketchChange = jest.fn();
      const { store } = renderProvider({ onSketchChange });

      // Act
      act(() => store.addNode("file"));

      // Assert
      expect(onSketchChange).toHaveBeenCalledTimes(1);
      expect(onSketchChange).toHaveBeenCalledWith(store.getState().sketch);
    });

    it("should report the sketch that an edit of the config makes, and not its evaluation", () => {
      // Arrange
      const onSketchChange = jest.fn();
      const { store } = renderProvider({ onSketchChange });

      // Act
      act(() => store.changeConfig("{}"));
      act(() => jest.advanceTimersByTime(EVALUATION_DELAY));

      // Assert
      expect(onSketchChange).toHaveBeenCalledTimes(1);
      expect(onSketchChange).toHaveBeenCalledWith({ ...SKETCH, config: "{}" });
    });

    it("should report it after the render that shows it", () => {
      // Arrange
      const shown: (string | null)[] = [];
      const onSketchChange = jest.fn(() => {
        shown.push(view.getByRole("status").textContent);
      });
      const { store } = renderProvider({ onSketchChange });

      // Act
      act(() => store.addNode("file"));

      // Assert
      expect(shown).toEqual(["2"]);
    });

    it("should report only the last of the edits that come in the same act", () => {
      // Arrange
      const onSketchChange = jest.fn();
      const { store } = renderProvider({ onSketchChange });

      // Act
      act(() => {
        store.addNode("file");
        store.changeConfig("{}");
      });

      // Assert
      expect(onSketchChange).toHaveBeenCalledTimes(1);
      expect(onSketchChange).toHaveBeenCalledWith(store.getState().sketch);
      expect(store.getState().sketch.config).toBe("{}");
    });

    it("should not report a change that is not of the sketch", () => {
      // Arrange
      const onSketchChange = jest.fn();
      const { store } = renderProvider({ onSketchChange });

      // Act
      act(() => {
        store.open({ kind: "config" });
        store.setView("text");
        store.toggleFolder("src", false);
      });

      // Assert
      expect(onSketchChange).not.toHaveBeenCalled();
    });

    it("should not report the same sketch again when the callback changes", () => {
      // Arrange
      const first = jest.fn();
      const second = jest.fn();
      const { store, update } = renderProvider({ onSketchChange: first });

      act(() => store.addNode("file"));

      // Act
      update({ onSketchChange: second });

      // Assert
      expect(first).toHaveBeenCalledTimes(1);
      expect(second).not.toHaveBeenCalled();
    });

    it("should report the next sketch to the callback it has then", () => {
      // Arrange
      const first = jest.fn();
      const second = jest.fn();
      const { store, update } = renderProvider({ onSketchChange: first });

      update({ onSketchChange: second });

      // Act
      act(() => store.addNode("file"));

      // Assert
      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledWith(store.getState().sketch);
    });
  });

  describe("unmount", () => {
    it("should dispose the store, so that a pending evaluation does not run", () => {
      // Arrange
      const { store, unmount } = renderProvider();

      act(() => store.changeConfig("{}"));
      getEvaluate().mockClear();

      // Act
      unmount();
      jest.advanceTimersByTime(EVALUATION_DELAY * 2);

      // Assert
      expect(jest.getTimerCount()).toBe(0);
      expect(getEvaluate()).not.toHaveBeenCalled();
      expect(store.getState().evaluation.sketch).toBe(SKETCH);
    });

    it("should not report a sketch after it unmounted", () => {
      // Arrange
      const onSketchChange = jest.fn();
      const { store, unmount } = renderProvider({ onSketchChange });

      // Act
      unmount();
      store.addNode("file");

      // Assert
      expect(onSketchChange).not.toHaveBeenCalled();
    });
  });
});
