/* global jest -- the mock is for specs, which run in Jest */
import { act, render } from "@testing-library/react";
import type { RenderResult } from "@testing-library/react";
import type { ReactNode } from "react";

import type { ProjectCapabilities, Sketch } from "@/contract";
import {
  EVALUATION_TIME_LIMIT,
  LATE_AFTER,
} from "@/domains/evaluation/helpers/evaluator";
import {
  failInlineWorkers,
  releaseInlineWorkers,
} from "@/shared/testing/inlineWorker";

import { SessionProvider } from "./SessionProvider";
import { EVALUATION_DELAY } from "./store.constants";
import { useSessionSelector, useSessionStore } from "./store.hooks";
import type { SessionStore } from "./store.types";

/** Everything can be edited, as on the website. */
export const ALL_CAPABILITIES: ProjectCapabilities = {
  editTree: true,
  editDependencies: true,
  editConfig: true,
};

/** Nothing can be edited. */
export const NO_CAPABILITIES: ProjectCapabilities = {
  editTree: false,
  editDependencies: false,
  editConfig: false,
};

/** What {@link renderInSession} takes. */
export type SessionRenderOptions = {
  /** The sketch the store starts from. */
  readonly sketch: Sketch;
  /** What the user can change; everything when it is unset. */
  readonly capabilities?: ProjectCapabilities;
};

/** What {@link renderInSession} returns: the render, the store of the instance and the spy that receives each sketch an edit makes. */
export type SessionRender = RenderResult & {
  /** The store that the provider created, to read its state and to act on it as another pane would. */
  readonly store: SessionStore;
  /** Called by the provider with each sketch an edit makes. */
  readonly onSketchChange: jest.Mock<void, [Sketch]>;
};

/**
 * Renders a connected component inside a `SessionProvider`, so that a spec can drive it through the page and read the store.
 * @param ui The component, or the components, to render.
 * @param options The sketch and the capabilities.
 * @param options.sketch The sketch the store starts from.
 * @param options.capabilities What the user can change; everything when it is unset.
 * @returns The render, the store and the spy of the sketches.
 */
export function renderInSession(
  ui: ReactNode,
  { sketch, capabilities = ALL_CAPABILITIES }: SessionRenderOptions
): SessionRender {
  const onSketchChange: jest.Mock<void, [Sketch]> = jest.fn();
  const holder: { store?: SessionStore } = {};

  /**
   * Hands the store of the provider to the spec.
   * @returns Nothing to render.
   */
  function StoreProbe(): null {
    holder.store = useSessionStore();
    return null;
  }

  const result = render(
    <SessionProvider
      initialSketch={sketch}
      capabilities={capabilities}
      onSketchChange={onSketchChange}
    >
      <StoreProbe />
      {ui}
    </SessionProvider>
  );

  return {
    ...result,
    // The probe renders with the provider, so the store is there once `render` returns
    store: holder.store as SessionStore,
    onSketchChange,
  };
}

/** The sketch {@link renderHookInSession} starts from when it is given none: two files and an empty config. */
export const HOOK_SKETCH: Sketch = {
  config: "{ settings: {}, rules: {} }",
  tree: [
    { path: "src/helpers/format.js", kind: "file" },
    { path: "src/index.js", kind: "file" },
  ],
  dependencies: [],
};

/** What {@link renderHookInSession} returns. */
export type HookRender<Result> = {
  /** The store that the provider created. */
  readonly store: SessionStore;
  /** What the hook returned in each render, in order, from the first one that had an evaluation. The renders before it, which the provider makes before its effect asks for the evaluation of the sketch, are left out, so that the first result is the one of the sketch as the panes show it. */
  readonly results: Result[];
  /** What the hook returned in the last render. */
  readonly result: { readonly current: Result };
};

/**
 * Renders a hook inside a provider that has a store, so that a spec can drive the store as another pane would. The workers of the specs answer at once, so the evaluation of the sketch has arrived when it returns.
 * @param useHook The hook, or a function that calls several.
 * @param sketch The sketch the store starts from; {@link HOOK_SKETCH} when it is unset.
 * @returns The store and what the hook returned.
 */
export function renderHookInSession<Result>(
  useHook: () => Result,
  sketch: Sketch = HOOK_SKETCH
): HookRender<Result> {
  const results: Result[] = [];

  /**
   * Calls the hook in a component and remembers what it returned.
   * @returns Nothing to render.
   */
  function Probe(): null {
    const result = useHook();
    const isEvaluated = useSessionSelector(
      (state) => state.evaluation !== undefined
    );

    if (isEvaluated) {
      results.push(result);
    }
    return null;
  }

  const { store } = renderInSession(<Probe />, { sketch });

  return {
    store,
    results,
    result: {
      get current(): Result {
        return results[results.length - 1];
      },
    },
  };
}

/**
 * Leaves nothing in focus the way the user does, with the close button of the node pane: an instance starts with the config in focus. It closes inside `act`, so that the panes render the state, and the sketch does not change.
 * @param store The store of the instance.
 */
export function leaveNothingOpen(store: SessionStore): void {
  act(() => store.close());
}

/**
 * Advances the fake clock past the delay of an evaluation of the config, inside `act` so that the panes render the evaluation. The spec uses `jest.useFakeTimers()`.
 */
export function waitForEvaluation(): void {
  act(() => jest.advanceTimersByTime(EVALUATION_DELAY));
}

/**
 * Advances the fake clock until the evaluator that holds a request reports that it is late, inside `act` so that the panes render the status. The spec uses `jest.useFakeTimers()` before it renders, and `holdInlineWorkers()` before the request.
 */
export function waitUntilEvaluationIsLate(): void {
  act(() => jest.advanceTimersByTime(LATE_AFTER));
}

/**
 * Advances the fake clock until the evaluator that holds a request stops it for taking too long, inside `act` so that the panes render the status. The spec uses `jest.useFakeTimers()` before it renders, and `holdInlineWorkers()` before the request.
 */
export function waitUntilEvaluationStops(): void {
  act(() => jest.advanceTimersByTime(EVALUATION_TIME_LIMIT));
}

/**
 * Makes the workers that hold a request fail, as a script that throws or cannot load, inside `act` so that the panes render the status.
 */
export function failEvaluation(): void {
  act(() => failInlineWorkers());
}

/**
 * Lets the workers answer the requests that they hold, inside `act` so that the panes render the evaluation.
 */
export function releaseEvaluation(): void {
  act(() => releaseInlineWorkers());
}
