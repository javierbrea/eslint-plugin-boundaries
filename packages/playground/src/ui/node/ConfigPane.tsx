import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { PaneHead } from "../common";
import { ConfigEditor } from "../config";

import type { ConfigPaneProps } from "./ConfigPane.types";
import { NodeFrame } from "./NodeFrame";

// A definite height for the editor, which fills its container: the head takes its own, and the editor the rest
const EditorSlot = styled("div")({ flex: 1, minHeight: 0 });

// A host styles its `code`, such as the chip of the website's docs: here it is the text of the hint in the mono font, with no box
const Mono = styled("code")({
  padding: 0,
  border: 0,
  borderRadius: 0,
  backgroundColor: "transparent",
  fontFamily: "var(--jsb-font-mono)",
  fontSize: "inherit",
  lineHeight: "inherit",
  verticalAlign: "baseline",
});

/**
 * The node pane when the config is open: the editor of its text, with the problems marked at their ranges.
 * @param props ConfigPane props.
 * @param props.config The config text.
 * @param props.problems The problems of the config.
 * @param props.readOnly Whether the text cannot be edited.
 * @param props.reveal The range to scroll to.
 * @param props.highlight The lines to mark.
 * @param props.onChange Called with the text after each edit of the user.
 * @returns The pane.
 */
export function ConfigPane({
  config,
  problems,
  readOnly,
  reveal,
  highlight,
  onChange,
}: Readonly<ConfigPaneProps>): ReactNode {
  return (
    <NodeFrame>
      <PaneHead
        label="Config"
        path="eslint.config.js"
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
          label="eslint.config.js"
          readOnly={readOnly}
          reveal={reveal}
          highlight={highlight}
        />
      </EditorSlot>
    </NodeFrame>
  );
}
