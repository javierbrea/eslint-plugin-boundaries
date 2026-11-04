import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import type { ReactNode } from "react";

import { PaneHead } from "../common";
import { Icon } from "../icons";

import { DependencyLines } from "./DependencyLines";
import type { DependencyLine } from "./DependencyLines.types";
import type { FilePaneProps } from "./FilePane.types";
import { NodeFrame } from "./NodeFrame";

/** The dependencies of a file, none until phase 6 reads them from the sketch. */
const NO_LINES: readonly DependencyLine[] = [];

const Code = styled("div")(({ theme }) => ({
  boxSizing: "border-box",
  flex: 1,
  minHeight: 0,
  padding: "10px 0",
  overflow: "auto",
  backgroundColor: "var(--jsb-code)",
  color: "var(--jsb-code-fg)",
  ...theme.typography.code,
}));

// Aligned with the statements of the lines, which start after the 44 px of the line numbers
const Message = styled("p")({
  margin: 0,
  padding: "0 14px 0 44px",
  color: "var(--jsb-code-comment)",
});

// The tooltip needs an element that gets the pointer events: a disabled button gets none. The wrapper is focusable so that the keyboard shows it too
const Slot = styled("span")({
  display: "inline-flex",
  margin: "8px 0 0 44px",
  borderRadius: "var(--jsb-radius)",
});

const AddButton = styled(Button)({
  borderStyle: "dashed",
  borderColor: "color-mix(in srgb, var(--jsb-code-fg) 35%, transparent)",
  color: "var(--jsb-code-fg)",
  // The disabled outlined button of MUI sets the whole border, which would make it solid
  "&.Mui-disabled": {
    borderStyle: "dashed",
    borderColor: "color-mix(in srgb, var(--jsb-code-fg) 35%, transparent)",
    color: "var(--jsb-code-fg)",
  },
});

/**
 * The node pane when a file is open: its path in the head and, on a code area, the list of its dependencies. The list is empty until the next milestone, and so is the button that adds one.
 * @param props FilePane props.
 * @param props.path Path of the open file.
 * @returns The pane.
 */
export function FilePane({ path }: Readonly<FilePaneProps>): ReactNode {
  return (
    <NodeFrame>
      <PaneHead label="File" path={path} />
      <Code>
        <DependencyLines lines={NO_LINES} />
        <Message>No dependencies yet.</Message>
        <Tooltip title="Dependencies arrive in the next milestone">
          <Slot tabIndex={0}>
            <AddButton
              variant="outlined"
              size="small"
              disabled
              startIcon={<Icon name="plus" />}
            >
              Dependency
            </AddButton>
          </Slot>
        </Tooltip>
      </Code>
    </NodeFrame>
  );
}
