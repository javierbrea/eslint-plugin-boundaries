import type { ReactNode } from "react";

import { useConfigEditorSnapshot } from "@/domains/config/ui/contexts/ConfigEditorSnapshotContext";
import { ConfigPane } from "@/domains/config/ui/molecules/ConfigPane";
import {
  useCapabilities,
  useChangeConfig,
  useConfig,
  useConfigProblems,
  usePolicyHighlight,
  useReveal,
} from "@/domains/session/data/store";

import { CONFIG_NODE_TEST_ID } from "./ConfigNode.constants";
import type { ConfigNodeProps } from "./ConfigNode.types";

/**
 * The config open in the node pane: it renders again for each edit of the config, and the rest of the node pane does not. It reads the config, its problems, the reveal, the policy to highlight and the capabilities from the store, and the snapshot of the editor from the context. Each edit of the user goes to the store with the range of the highlight that the editor moved with it, in one call.
 * @param props ConfigNode props.
 * @param props.frameLabel The accessible name of the landmark of the pane.
 * @returns The config pane, with the editor of the instance.
 */
export function ConfigNode({
  frameLabel,
}: Readonly<ConfigNodeProps>): ReactNode {
  const config = useConfig();
  const problems = useConfigProblems();
  const reveal = useReveal();
  const highlight = usePolicyHighlight();
  const snapshot = useConfigEditorSnapshot();
  const { editConfig } = useCapabilities();
  const changeConfig = useChangeConfig();

  return (
    <ConfigPane
      config={config}
      problems={problems}
      readOnly={!editConfig}
      reveal={reveal}
      highlight={highlight?.range}
      snapshot={snapshot}
      onChange={changeConfig}
      frameLabel={frameLabel}
      testId={CONFIG_NODE_TEST_ID}
    />
  );
}
