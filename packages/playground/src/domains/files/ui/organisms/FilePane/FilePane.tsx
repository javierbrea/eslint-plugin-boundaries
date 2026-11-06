import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import { useCallback, useRef } from "react";
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

// Aligned with the statements of the lines, which start after the 44 px of the line numbers, and 18 px under the last of them: the 10 px that the lines leave below them in the mockup and the 8 px of the button. It is medium weight, and 28 px tall rather than the 30 px of the buttons or the 26 px of the small ones. It sits on the baseline of its line, with its icon as its first child, as the mockup's button does: the line is then a little taller than the button, and the hint a little more than its margin below it
const AddButton = styled(Button)(({ theme }) => ({
  height: 28,
  margin: "18px 0 0 44px",
  borderStyle: "dashed",
  borderColor: "color-mix(in srgb, var(--jsb-code-fg) 35%, transparent)",
  color: "var(--jsb-code-fg)",
  fontWeight: theme.typography.fontWeightMedium,
  verticalAlign: "baseline",
}));

const Hint = styled("p")(({ theme }) => ({
  margin: "18px 0 0 44px",
  padding: "0 14px 0 0",
  ...theme.typography.caption,
  lineHeight: 1.5,
  color: "var(--jsb-code-comment)",
}));

/**
 * The node pane when a file is open: its path in the head and, on a code area, the list of its dependencies with their verdicts, the button that adds one and a hint about the picker. It shows what it is given and reports what the user does: the picker and the store are the business of the module that renders it. When the user removes the only line, the keyboard focus goes to the button that adds one.
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
  const addButton = useRef<HTMLButtonElement>(null);
  // The lines have delete actions only when the dependencies can be edited, which is when the button is drawn
  const focusAdd = useCallback(
    () => (addButton.current as HTMLButtonElement).focus(),
    []
  );

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
          onEmptied={focusAdd}
        />
        {editable ? (
          <>
            <AddButton ref={addButton} variant="outlined" onClick={onAdd}>
              <Icon name="plus" />
              {ADD_DEPENDENCY_LABEL}
            </AddButton>
            <Hint>{FILE_PANE_HINT}</Hint>
          </>
        ) : null}
      </Code>
    </PaneFrame>
  );
}
