import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import OutlinedInput from "@mui/material/OutlinedInput";
import { styled } from "@mui/material/styles";
import ToggleButton from "@mui/material/ToggleButton";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";

import {
  SPECIFIER_KIND_LABELS,
  getChipLabel,
  getChipParts,
} from "@/domains/files/ui/helpers/dependencyLabels";
import type { SpecifierKind } from "@/domains/files/ui/helpers/dependencyLabels";
import { Icon } from "@/ui-kit/atoms/Icon";

import {
  ADD_NAME_LABEL,
  ALIAS_FIELD_LABEL,
  CANCEL_NAME_LABEL,
  CONFIRM_NAME_LABEL,
  NAME_FIELD_LABEL,
  NAME_KIND_LABEL,
  NAMES_EDITOR_LABEL,
  REMOVE_NAME_LABEL,
} from "./NamesEditor.constants";
import type { NamesEditorProps } from "./NamesEditor.types";

/** The name that the user is writing in the editor. */
type NewName = {
  readonly kind: SpecifierKind;
  readonly name: string;
  readonly alias: string;
};

// The chips and the control that adds one share a row that wraps
const Row = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 6,
});

// The list takes no box of its own, so that its chips are laid out in the row with the control that adds one
const Chips = styled("ul")({ display: "contents", listStyle: "none" });

const Kind = styled("span")({ color: "var(--jsb-muted)" });

const RemoveButton = styled(ButtonBase)({
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
  width: 16,
  height: 16,
  // The chip pads its end by 10 px, and the button sits 6 px from it
  marginRight: -4,
  borderRadius: "50%",
  backgroundColor: "var(--jsb-line)",
  color: "var(--jsb-muted)",
  "&:hover": { color: "var(--jsb-ink)" },
});

const AddChip = styled(Chip)(({ theme }) => ({
  ...theme.typography.caption,
  lineHeight: 1,
  borderStyle: "dashed",
  color: "var(--jsb-muted)",
}));

const Editor = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 6,
});

// The segmented look of the toggle group of the theme, which the buttons would have as a group: a group of MUI keeps its buttons in a roving tab index that updates its state when it goes away, and the editor goes away each time a name is added
const Kinds = styled("div")({
  display: "inline-flex",
  padding: 2,
  border: "1px solid var(--jsb-line)",
  borderRadius: "var(--jsb-radius)",
});

const NameInput = styled(OutlinedInput)({ width: 100 });

const AliasInput = styled(OutlinedInput)({ width: 76 });

const As = styled("span")({ color: "var(--jsb-muted)" });

/**
 * The names of a statement as chips with a button that removes each one, and a chip that opens an editor in the same row to add one: the kind among the ones the syntax holds, the name and, for a named one, an optional alias. Enter or the confirm button adds the name, and Escape or the cancel button closes the editor. The focus goes back to the chip that adds a name when the editor closes or a name is removed.
 * @param props NamesEditor props.
 * @param props.specifiers The names of the statement.
 * @param props.kinds The kinds of name that the syntax holds.
 * @param props.onAdd Called with the name that the user adds.
 * @param props.onRemove Called with the position of the name that the user removes.
 * @returns The group of the names and the control that adds one.
 */
export function NamesEditor({
  specifiers,
  kinds,
  onAdd,
  onRemove,
}: Readonly<NamesEditorProps>): ReactNode {
  const [newName, setNewName] = useState<NewName | null>(null);
  const addChipRef = useRef<HTMLDivElement>(null);
  const wasEditingRef = useRef(false);
  const isEditing = newName !== null;
  // The syntax may change while the editor is open, and the kind that was picked is no longer held
  const editing =
    newName === null
      ? null
      : {
          ...newName,
          kind: kinds.includes(newName.kind) ? newName.kind : kinds[0],
        };

  // The editor takes the focus when it opens, and the chip that opened it takes it back when it closes: the controls of the editor are gone by then
  useEffect(() => {
    if (wasEditingRef.current && !isEditing) {
      (addChipRef.current as HTMLDivElement).focus();
    }
    wasEditingRef.current = isEditing;
  }, [isEditing]);

  /**
   * Adds the name that was written, unless it has no name.
   * @param entry The name in the editor.
   */
  function confirmName(entry: NewName): void {
    const written = entry.name.trim();
    const alias = entry.alias.trim();

    if (written === "") {
      return;
    }
    onAdd(
      entry.kind === "named" && alias !== ""
        ? { kind: entry.kind, name: written, alias }
        : { kind: entry.kind, name: written }
    );
    setNewName(null);
  }

  /**
   * Removes a name, and leaves the focus where it can be used: the button that was pressed is gone.
   * @param index The position of the name.
   */
  function removeName(index: number): void {
    onRemove(index);
    addChipRef.current?.focus();
  }

  /**
   * Adds the name on Enter in one of its fields.
   * @param keyEvent The key press in the field.
   * @param entry The name in the editor.
   */
  function handleFieldKeyDown(
    keyEvent: ReactKeyboardEvent,
    entry: NewName
  ): void {
    if (keyEvent.key === "Enter") {
      confirmName(entry);
    }
  }

  /**
   * Closes the editor on Escape, anywhere in it, and keeps the key from reaching the dialog, which Escape would close.
   * @param keyEvent The key press in the editor.
   */
  function handleEditorKeyDown(keyEvent: ReactKeyboardEvent): void {
    if (keyEvent.key === "Escape") {
      keyEvent.stopPropagation();
      setNewName(null);
    }
  }

  return (
    <Row role="group" aria-label={NAMES_EDITOR_LABEL}>
      <Chips role="list">
        {specifiers.map((specifier, index) => {
          const { kind, name: chipName } = getChipParts(specifier);

          return (
            <Chip
              // The chips hold no state of their own, so a position is as good as a name, which a draft may repeat

              key={index}
              component="li"
              variant="outlined"
              label={
                <>
                  <Kind>{kind}</Kind> {chipName}
                  <RemoveButton
                    aria-label={`${REMOVE_NAME_LABEL} ${getChipLabel(specifier)}`}
                    onClick={() => removeName(index)}
                  >
                    <Icon name="cross" size={10} />
                  </RemoveButton>
                </>
              }
            />
          );
        })}
      </Chips>
      {editing === null ? (
        <AddChip
          ref={addChipRef}
          variant="outlined"
          clickable
          aria-label={ADD_NAME_LABEL}
          label={
            <>
              <Icon name="plus" size={12} />
              Name
            </>
          }
          onClick={() => setNewName({ kind: kinds[0], name: "", alias: "" })}
        />
      ) : (
        <Editor onKeyDown={handleEditorKeyDown}>
          <Kinds role="group" aria-label={NAME_KIND_LABEL}>
            {kinds.map((kind) => (
              <ToggleButton
                key={kind}
                value={kind}
                selected={kind === editing.kind}
                onChange={() => setNewName({ ...editing, kind })}
              >
                {SPECIFIER_KIND_LABELS[kind]}
              </ToggleButton>
            ))}
          </Kinds>
          <NameInput
            size="small"
            autoFocus
            value={editing.name}
            slotProps={{ input: { "aria-label": NAME_FIELD_LABEL } }}
            onChange={(changeEvent) =>
              setNewName({ ...editing, name: changeEvent.target.value })
            }
            onKeyDown={(keyEvent) => handleFieldKeyDown(keyEvent, editing)}
          />
          {editing.kind === "named" ? (
            <>
              <As>as</As>
              <AliasInput
                size="small"
                value={editing.alias}
                slotProps={{ input: { "aria-label": ALIAS_FIELD_LABEL } }}
                onChange={(changeEvent) =>
                  setNewName({ ...editing, alias: changeEvent.target.value })
                }
                onKeyDown={(keyEvent) => handleFieldKeyDown(keyEvent, editing)}
              />
            </>
          ) : null}
          <IconButton
            size="small"
            aria-label={CONFIRM_NAME_LABEL}
            disabled={editing.name.trim() === ""}
            onClick={() => confirmName(editing)}
          >
            <Icon name="check" size={14} />
          </IconButton>
          <IconButton
            size="small"
            aria-label={CANCEL_NAME_LABEL}
            onClick={() => setNewName(null)}
          >
            <Icon name="cross" size={14} />
          </IconButton>
        </Editor>
      )}
    </Row>
  );
}
