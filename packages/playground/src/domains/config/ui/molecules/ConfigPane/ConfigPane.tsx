import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { ConfigEditor } from "@/domains/config/ui/atoms/ConfigEditor";
import { CONFIG_PATH } from "@/domains/project/helpers/sketch";
import { Mono } from "@/ui-kit/atoms/Mono";
import { PaneFrame } from "@/ui-kit/atoms/PaneFrame";
import { PaneHead } from "@/ui-kit/atoms/PaneHead";
import { CloseButton } from "@/ui-kit/molecules/CloseButton";

import { CONFIG_PANE_LABEL, CONFIG_PANE_TEST_ID } from "./ConfigPane.constants";
import type { ConfigPaneProps } from "./ConfigPane.types";

// A definite height for the editor, which fills its container: the head takes its own, and the editor the rest
const EditorSlot = styled("div")({ flex: 1, minHeight: 0 });

/**
 * The node pane when the config is open: the head with the path of the config and the button that closes it, and the editor of its text, with the problems marked at their ranges.
 * @param props ConfigPane props.
 * @param props.config The config text.
 * @param props.problems The problems of the config.
 * @param props.readOnly Whether the text cannot be edited.
 * @param props.reveal The range to scroll to.
 * @param props.snapshot Where the editor leaves its snapshot and starts from.
 * @param props.highlight The range to mark.
 * @param props.onChange Called with the text and with where the highlight is after each edit of the user.
 * @param props.onClose Called when the user presses the close button of the head.
 * @param props.frameLabel The accessible name of the landmark of the pane.
 * @param props.testId The test id of the root element, in place of the default one.
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
  onClose,
  frameLabel,
  testId = CONFIG_PANE_TEST_ID,
}: Readonly<ConfigPaneProps>): ReactNode {
  return (
    <PaneFrame label={frameLabel} testId={testId}>
      <PaneHead
        label={CONFIG_PANE_LABEL}
        path={CONFIG_PATH}
        end={<CloseButton subject={CONFIG_PATH} onClose={onClose} />}
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
    </PaneFrame>
  );
}
