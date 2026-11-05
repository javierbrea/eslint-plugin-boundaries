import OutlinedInput from "@mui/material/OutlinedInput";
import Tooltip from "@mui/material/Tooltip";
import { useId, useRef, useState } from "react";
import type {
  ChangeEvent,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
} from "react";

import { RENAME_FIELD_LABEL } from "./RenameField.constants";
import type { RenameFieldProps } from "./RenameField.types";

/**
 * The field that renames a node in place, in the row of the tree. Enter and leaving the field rename the node, and Escape gives up. A refused name keeps the node as it was and says why next to the field: after Enter the field stays open so that the user can fix the name, and after leaving it the rename is given up.
 * @param props RenameField props.
 * @param props.path The path of the node being renamed.
 * @param props.name The current name of the node.
 * @param props.onCommit Called with the name that was typed.
 * @param props.onCancel Called when the user gives up.
 * @returns The field.
 */
export function RenameField({
  path,
  name: currentName,
  onCommit,
  onCancel,
}: Readonly<RenameFieldProps>): ReactNode {
  const [value, setValue] = useState(currentName);
  // The reason stays while the tooltip fades out, so that it does not fade out empty
  const [refusal, setRefusal] = useState({ reason: "", isShown: false });
  // Renaming or giving up removes the field, which can blur it once more: that blur is not a second decision
  const isDoneRef = useRef(false);
  const reasonId = useId();

  /**
   * Asks to rename the node with what was typed.
   * @returns Why the name is refused, or `undefined` when the node was renamed.
   */
  function commit(): string | undefined {
    const refused = onCommit(path, value);

    isDoneRef.current = refused === undefined;
    return refused;
  }

  /**
   * Keeps what the user typed, and hides the reason of the last refusal, which was about another name.
   * @param changeEvent The change of the input.
   */
  function handleChange(changeEvent: ChangeEvent<HTMLInputElement>): void {
    setValue(changeEvent.target.value);
    setRefusal((previous) => ({ ...previous, isShown: false }));
  }

  /**
   * Renames on Enter, gives up on Escape, and keeps every key from reaching the tree.
   * @param keyEvent The key press in the input.
   */
  function handleKeyDown(keyEvent: ReactKeyboardEvent<HTMLInputElement>): void {
    // The tree takes keys for itself: type-ahead, the arrows, space
    keyEvent.stopPropagation();
    if (keyEvent.key === "Enter") {
      const refused = commit();

      if (refused !== undefined) {
        setRefusal({ reason: refused, isShown: true });
      }
    } else if (keyEvent.key === "Escape") {
      isDoneRef.current = true;
      onCancel();
    }
  }

  /** Renames when the field loses the focus, and gives up if the name is refused. */
  function handleBlur(): void {
    if (!isDoneRef.current && commit() !== undefined) {
      isDoneRef.current = true;
      onCancel();
    }
  }

  return (
    <Tooltip
      open={refusal.isShown}
      title={refusal.reason}
      placement="bottom-start"
      id={reasonId}
      describeChild
      // The reason is shown by the rename, not by hovering or focusing the field: a native title would keep showing it after it was fixed
      disableHoverListener
      disableFocusListener
      disableTouchListener
    >
      <OutlinedInput
        size="small"
        autoFocus
        fullWidth
        error={refusal.isShown}
        value={value}
        slotProps={{
          input: {
            "aria-label": `${RENAME_FIELD_LABEL} ${path}`,
            "aria-describedby": refusal.isShown ? reasonId : undefined,
          },
        }}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={(focusEvent) => focusEvent.target.select()}
        // The row would take the click as a selection, or toggle the folder
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        sx={{ flex: 1, minWidth: 0 }}
      />
    </Tooltip>
  );
}
