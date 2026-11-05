import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { Icon } from "@/ui-kit/atoms/Icon";

import { NOTE_TEST_ID } from "./Note.constants";
import type { NoteProps } from "./Note.types";

const Frame = styled("div")(({ theme }) => ({
  display: "flex",
  gap: 8,
  margin: "6px 16px 0",
  padding: "8px 10px",
  border: "1px dashed var(--jsb-line-strong)",
  borderRadius: "var(--jsb-radius)",
  color: "var(--jsb-muted)",
  ...theme.typography.body2,
}));

/**
 * A dashed box with the info icon, for what a pane cannot show as a row: why there is nothing to list, or what is not evaluated. It has the margins of a note in the problems panel.
 * @param props Note props.
 * @param props.children What the note says.
 * @returns The note.
 */
export function Note({ children }: Readonly<NoteProps>): ReactNode {
  return (
    <Frame role="note" data-testid={NOTE_TEST_ID}>
      <Icon name="info" />
      <span>{children}</span>
    </Frame>
  );
}
