/* global jest -- the fixture is for specs, which run in Jest */
import { render } from "@testing-library/react";
import type { RenderResult } from "@testing-library/react";
import type { ReactNode } from "react";

import type { ProjectCapabilities, Sketch } from "@/contract";
import { useWorkbenchStore } from "@/ui/state/Hooks";
import type { WorkbenchStore } from "@/ui/state/Store.types";
import { WorkbenchProvider } from "@/ui/state/WorkbenchProvider";

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

/** What {@link renderInWorkbench} takes. */
export type WorkbenchRenderOptions = {
  /** The sketch the store starts from. */
  readonly sketch: Sketch;
  /** What the user can change; everything when it is unset. */
  readonly capabilities?: ProjectCapabilities;
};

/** What {@link renderInWorkbench} returns: the render, the store of the instance and the spy that receives each sketch an edit makes. */
export type WorkbenchRender = RenderResult & {
  /** The store that the provider created, to read its state and to act on it as another pane would. */
  readonly store: WorkbenchStore;
  /** Called by the provider with each sketch an edit makes. */
  readonly onSketchChange: jest.Mock<void, [Sketch]>;
};

/**
 * Renders a connected component inside a `WorkbenchProvider`, so that a spec can drive it through the page and read the store.
 * @param ui The component, or the components, to render.
 * @param options The sketch and the capabilities.
 * @param options.sketch The sketch the store starts from.
 * @param options.capabilities What the user can change; everything when it is unset.
 * @returns The render, the store and the spy of the sketches.
 */
export function renderInWorkbench(
  ui: ReactNode,
  { sketch, capabilities = ALL_CAPABILITIES }: WorkbenchRenderOptions
): WorkbenchRender {
  const onSketchChange: jest.Mock<void, [Sketch]> = jest.fn();
  const holder: { store?: WorkbenchStore } = {};

  /**
   * Hands the store of the provider to the spec.
   * @returns Nothing to render.
   */
  function StoreProbe(): null {
    holder.store = useWorkbenchStore();
    return null;
  }

  const result = render(
    <WorkbenchProvider
      initialSketch={sketch}
      capabilities={capabilities}
      onSketchChange={onSketchChange}
    >
      <StoreProbe />
      {ui}
    </WorkbenchProvider>
  );

  return {
    ...result,
    // The probe renders with the provider, so the store is there once `render` returns
    store: holder.store as WorkbenchStore,
    onSketchChange,
  };
}
