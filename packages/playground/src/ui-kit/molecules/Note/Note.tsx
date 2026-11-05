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
 * A dashed box with the info icon, for a remark that does not fit as a row of a list, such as why there is nothing to list. It has its own margin: 6 px above and 16 px at the sides.
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
