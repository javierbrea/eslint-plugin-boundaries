import type { ReactNode } from "react";

import type { ProjectCapabilities, Sketch } from "@/contract";

import type { SessionStore } from "./store.types";

/** What the hooks of the store read from the provider. */
export type SessionContextValue = {
  /** The store of the instance. */
  readonly store: SessionStore;
  /** What the user can change in the project. */
  readonly capabilities: ProjectCapabilities;
};

/** Props of {@link SessionProvider}. */
export type SessionProviderProps = {
  /** The sketch to start from. A later value is ignored: the store owns the sketch from then on, and a host that shows another sketch mounts the playground again. */
  readonly initialSketch: Sketch;
  /** What the user can change in the project. */
  readonly capabilities: ProjectCapabilities;
  /** Called with each new sketch after an edit, and never with the first one. */
  readonly onSketchChange: (sketch: Sketch) => void;
  /** The panes. */
  readonly children: ReactNode;
};
