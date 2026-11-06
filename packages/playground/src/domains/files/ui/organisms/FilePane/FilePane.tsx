import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { DependencyLines } from "@/domains/files/ui/molecules/DependencyLines";
import { Icon } from "@/ui-kit/atoms/Icon";
import { PaneFrame } from "@/ui-kit/atoms/PaneFrame";
import { PaneHead } from "@/ui-kit/atoms/PaneHead";

import {
  ADD_DEPENDENCY_LABEL,
  FILE_PANE_HINT,
  FILE_PANE_LABEL,
  FILE_PANE_TEST_ID,
} from "./FilePane.constants";
import type { FilePaneProps } from "./FilePane.types";

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
const AddButton = styled(Button)({
  margin: "8px 0 0 44px",
  borderStyle: "dashed",
  borderColor: "color-mix(in srgb, var(--jsb-code-fg) 35%, transparent)",
  color: "var(--jsb-code-fg)",
});

const Hint = styled("p")(({ theme }) => ({
  margin: "18px 0 0 44px",
  padding: "0 14px 0 0",
  ...theme.typography.caption,
  color: "var(--jsb-code-comment)",
}));

/**
 * The node pane when a file is open: its path in the head and, on a code area, the list of its dependencies with their verdicts, the button that adds one and a hint about the picker. It shows what it is given and reports what the user does: the picker and the store are the business of the module that renders it.
 * @param props FilePane props.
 * @param props.path Path of the open file.
 * @param props.frameLabel The accessible name of the landmark of the pane.
 * @param props.lines The dependencies of the file.
 * @param props.selectedIndex The position of the line in focus, if any.
 * @param props.editable Whether the dependencies can be added, edited and removed.
 * @param props.onSelect Called with the position of the line that the user chose.
 * @param props.onEdit Called with the position of the line whose edit action was pressed.
 * @param props.onRemove Called with the position of the line whose delete action was pressed.
 * @param props.onAdd Called when the user presses `+ Dependency`.
 * @returns The pane.
 */
export function FilePane({
  path,
  frameLabel,
  lines,
  selectedIndex,
  editable,
  onSelect,
  onEdit,
  onRemove,
  onAdd,
}: Readonly<FilePaneProps>): ReactNode {
  return (
    <PaneFrame label={frameLabel} testId={FILE_PANE_TEST_ID}>
      <PaneHead label={FILE_PANE_LABEL} path={path} />
      <Code>
        <DependencyLines
          lines={lines}
          selectedIndex={selectedIndex}
          editable={editable}
          onSelect={onSelect}
          onEdit={onEdit}
          onRemove={onRemove}
        />
        {editable ? (
          <>
            <AddButton
              variant="outlined"
              size="small"
              startIcon={<Icon name="plus" />}
              onClick={onAdd}
            >
              {ADD_DEPENDENCY_LABEL}
            </AddButton>
            <Hint>{FILE_PANE_HINT}</Hint>
          </>
        ) : null}
      </Code>
    </PaneFrame>
  );
}
