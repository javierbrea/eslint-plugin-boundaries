import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import type { ReactNode } from "react";

import type { ProjectView } from "@/domains/session/helpers/focus";
import { Icon } from "@/ui-kit/atoms/Icon";

import {
  ADD_FILE_LABEL,
  ADD_FOLDER_LABEL,
  PROJECT_FOOT_TEST_ID,
  PROJECT_VIEW_LABEL,
} from "./ProjectFoot.constants";
import type { ProjectFootProps } from "./ProjectFoot.types";

const Foot = styled("div")({
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "0 8px",
  borderTop: "1px solid var(--jsb-line)",
});

const Spacer = styled("span")({ flex: 1 });

/**
 * The foot of the project pane: the buttons that add a file or a folder, when the tree can be edited, and the toggle that switches between the tree and the text.
 * @param props ProjectFoot props.
 * @param props.view How the project is shown.
 * @param props.editable Whether nodes can be added.
 * @param props.onAdd Called with the kind of node the user asks to add.
 * @param props.onViewChange Called with the view the user switches to.
 * @returns The foot.
 */
export function ProjectFoot({
  view,
  editable,
  onAdd,
  onViewChange,
}: Readonly<ProjectFootProps>): ReactNode {
  return (
    <Foot data-testid={PROJECT_FOOT_TEST_ID}>
      {editable ? (
        <>
          <Button
            size="small"
            startIcon={<Icon name="plus" />}
            aria-label={ADD_FILE_LABEL}
            onClick={() => onAdd("file")}
          >
            File
          </Button>
          <Button
            size="small"
            startIcon={<Icon name="plus" />}
            aria-label={ADD_FOLDER_LABEL}
            onClick={() => onAdd("folder")}
          >
            Folder
          </Button>
        </>
      ) : null}
      <Spacer />
      <ToggleButtonGroup
        exclusive
        size="small"
        value={view}
        aria-label={PROJECT_VIEW_LABEL}
        onChange={(_event, next: ProjectView | null) => {
          // The selected button reports `null` when it is pressed again
          if (next !== null) {
            onViewChange(next);
          }
        }}
      >
        <ToggleButton value="tree">Tree</ToggleButton>
        <ToggleButton value="text">Text</ToggleButton>
      </ToggleButtonGroup>
    </Foot>
  );
}
