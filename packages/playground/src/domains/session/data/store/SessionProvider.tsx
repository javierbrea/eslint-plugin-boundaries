import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";

import { SessionContext } from "./sessionContext";
import type {
  SessionContextValue,
  SessionProviderProps,
} from "./SessionProvider.types";
import { createSessionStore } from "./store";

/**
 * Creates the store of one playground instance, which refuses the edits that the capabilities of the project do not allow, and provides it to the panes. It reports each sketch that an edit makes, once, after the render that shows it; the sketch it starts from is not reported.
 * @param props SessionProvider props.
 * @param props.initialSketch The sketch to start from. A later value is ignored.
 * @param props.capabilities What the user can change in the project. A later value is ignored.
 * @param props.onSketchChange Called with each new sketch after an edit.
 * @param props.children The panes.
 * @returns The provider.
 */
export function SessionProvider({
  initialSketch,
  capabilities,
  onSketchChange,
  children,
}: Readonly<SessionProviderProps>): ReactNode {
  const [store] = useState(() =>
    createSessionStore(initialSketch, capabilities)
  );
  const sketch = useSyncExternalStore(
    store.subscribe,
    () => store.getState().sketch
  );
  const reportedRef = useRef(sketch);

  // The evaluator starts its worker once the instance is mounted, never in a render, and stops it when the instance goes away. React mounts an instance twice in development, so the store can start again after it was disposed
  useEffect(() => {
    store.start();
    return () => store.dispose();
  }, [store]);

  // A callback that changes between renders must not report the same sketch again
  useEffect(() => {
    if (reportedRef.current !== sketch) {
      reportedRef.current = sketch;
      onSketchChange(sketch);
    }
  }, [sketch, onSketchChange]);

  const value = useMemo<SessionContextValue>(() => ({ store }), [store]);

  return <SessionContext value={value}>{children}</SessionContext>;
}
