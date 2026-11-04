import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";

import { createWorkbenchStore } from "./Store";
import { WorkbenchContext } from "./WorkbenchContext";
import type {
  ConfigEditorSnapshot,
  WorkbenchContextValue,
  WorkbenchProviderProps,
} from "./WorkbenchProvider.types";

/**
 * Creates the store of one playground instance and provides it to the panes, with the capabilities of the project and the snapshot of the config editor. It reports each sketch that an edit makes, once, after the render that shows it; the sketch it starts from is not reported.
 * @param props WorkbenchProvider props.
 * @param props.initialSketch The sketch to start from. A later value is ignored.
 * @param props.capabilities What the user can change in the project.
 * @param props.onSketchChange Called with each new sketch after an edit.
 * @param props.children The panes.
 * @returns The provider.
 */
export function WorkbenchProvider({
  initialSketch,
  capabilities,
  onSketchChange,
  children,
}: Readonly<WorkbenchProviderProps>): ReactNode {
  const [store] = useState(() => createWorkbenchStore(initialSketch));
  const configEditor = useRef<ConfigEditorSnapshot | undefined>(undefined);
  const sketch = useSyncExternalStore(
    store.subscribe,
    () => store.getState().sketch
  );
  const reportedRef = useRef(sketch);

  // An evaluation that waits out its delay must not run once the instance is gone
  useEffect(() => () => store.dispose(), [store]);

  // A callback that changes between renders must not report the same sketch again
  useEffect(() => {
    if (reportedRef.current !== sketch) {
      reportedRef.current = sketch;
      onSketchChange(sketch);
    }
  }, [sketch, onSketchChange]);

  const value = useMemo<WorkbenchContextValue>(
    () => ({ store, capabilities, configEditor }),
    [store, capabilities]
  );

  return <WorkbenchContext value={value}>{children}</WorkbenchContext>;
}
