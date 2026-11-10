import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import type {
  InspectorRowTone,
  InspectorRowsProps,
} from "./InspectorRows.types";

/** The color of each tone, from the tokens of the host. */
const TONE_COLORS: Readonly<Record<InspectorRowTone, string>> = {
  ink: "var(--jsb-ink)",
  muted: "var(--jsb-muted)",
  faint: "var(--jsb-faint)",
};

const List = styled("ul")({ margin: 0, padding: 0, listStyle: "none" });

// Aligned with the header of a section that folds: the left of the label is where its label is, after the chevron and its gap, 12 px and 8 px
const Row = styled("li")({
  display: "flex",
  alignItems: "baseline",
  gap: 8,
  minWidth: 0,
  padding: "4px 0 4px 20px",
});

const Label = styled("span")(({ theme }) => ({
  flex: "none",
  ...theme.typography.paneLabel,
  color: "var(--jsb-muted)",
}));

const RowText = styled("span", {
  shouldForwardProp: (prop) => prop !== "tone",
})<{ tone: InspectorRowTone }>(({ theme, tone }) => ({
  minWidth: 0,
  overflow: "hidden",
  color: TONE_COLORS[tone],
  ...theme.typography.monoSmall,
  fontWeight: theme.typography.fontWeightMedium,
  lineHeight: 1.4,
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}));

/**
 * The rows of the sections of the inspector that have nothing to fold, such as `to —` while no dependency is in focus: the name of the section in the pane label style, and a text after it. The rows line up with the headers of the sections that fold, which have a chevron before their label. The full text is the `title` of the row, for when it is cut.
 * @param props InspectorRows props.
 * @param props.rows The rows.
 * @returns The list of rows.
 */
export function InspectorRows({
  rows,
}: Readonly<InspectorRowsProps>): ReactNode {
  return (
    <List>
      {rows.map(({ label, text, tone }) => (
        <Row key={label}>
          <Label>{label}</Label>
          <RowText tone={tone} title={text}>
            {text}
          </RowText>
        </Row>
      ))}
    </List>
  );
}
