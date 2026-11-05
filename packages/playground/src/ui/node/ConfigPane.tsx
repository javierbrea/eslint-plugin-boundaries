import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { CONFIG_PATH } from "@/domains/project/helpers/sketch";
import { Mono, PaneHead } from "@/ui/common";
import { ConfigEditor } from "@/ui/config";

import type { ConfigPaneProps } from "./ConfigPane.types";
import { NodeFrame } from "./NodeFrame";

// A definite height for the editor, which fills its container: the head takes its own, and the editor the rest
const EditorSlot = styled("div")({ flex: 1, minHeight: 0 });

/**
 * The node pane when the config is open: the editor of its text, with the problems marked at their ranges.
 * @param props ConfigPane props.
 * @param props.config The config text.
 * @param props.problems The problems of the config.
 * @param props.readOnly Whether the text cannot be edited.
 * @param props.reveal The range to scroll to.
 * @param props.snapshot Where the editor leaves its snapshot and starts from.
 * @param props.highlight The lines to mark.
 * @param props.onChange Called with the text after each edit of the user.
 * @returns The pane.
 */
export function ConfigPane({
  config,
  problems,
  readOnly,
  reveal,
  snapshot,
  highlight,
  onChange,
}: Readonly<ConfigPaneProps>): ReactNode {
  return (
    <NodeFrame>
      <PaneHead
        label="Config"
        path={CONFIG_PATH}
        hint={
          <>
            JSON5 · the <Mono>settings</Mono> and <Mono>rules</Mono> of an
            ESLint config
          </>
        }
      />
      <EditorSlot>
        <ConfigEditor
          value={config}
          onChange={onChange}
          problems={problems}
          label={CONFIG_PATH}
          readOnly={readOnly}
          reveal={reveal}
          snapshot={snapshot}
          highlight={highlight}
        />
      </EditorSlot>
    </NodeFrame>
  );
}
