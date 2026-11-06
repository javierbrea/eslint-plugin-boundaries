import ButtonBase from "@mui/material/ButtonBase";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import {
  getElementTypeRow,
  getFileCategoryRow,
  getPoliciesRows,
} from "@/domains/config/ui/helpers/configRows";
import type { ConfigRow } from "@/domains/config/ui/helpers/configRows";
import { CONFIG_PATH } from "@/domains/project/helpers/sketch";
import type { Target } from "@/domains/session/helpers/focus";
import { SectionTitle } from "@/ui-kit/atoms/SectionTitle";
import { STATE_TEXT } from "@/ui-kit/helpers/theme";
import type { Tone } from "@/ui-kit/helpers/tone";

import { CONFIG_INSPECTOR_TEST_ID } from "./ConfigInspector.constants";
import type { ConfigInspectorProps } from "./ConfigInspector.types";

// The inspector is a fragment of the content of the layout, whose grid places its parts: the root takes no box of its own, so that the test id has an element to be on
const Root = styled("div")({ display: "contents" });

const List = styled("ul")({
  display: "grid",
  margin: 0,
  padding: 0,
  // The rows have square corners, so the list clips them to its own
  overflow: "hidden",
  listStyle: "none",
  border: "1px solid var(--jsb-line)",
  borderRadius: "var(--jsb-radius)",
  "& > li + li": { borderTop: "1px solid var(--jsb-line)" },
});

// The name takes the room the status leaves and wraps inside its column, and the status stays at the end of the first line, as the mockup lays it out: at the default width of the inspector, a rule name and `not evaluated` take all the room there is, and a long name goes onto a second line beside its count. The detail takes the line under both
const RowButton = styled(ButtonBase)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  // The count sits next to the first line of the name, not in the middle of it
  alignItems: "start",
  justifyContent: "stretch",
  gap: "2px 10px",
  boxSizing: "border-box",
  width: "100%",
  padding: "7px 10px",
  textAlign: "left",
  ...theme.typography.monoSmall,
  color: "var(--jsb-ink)",
  "&:hover": { backgroundColor: "var(--jsb-accent-soft)" },
  // The list clips what is outside it
  "&:focus-visible": { outlineOffset: -2 },
}));

// A name longer than the row still wraps, so that a long pattern never overflows it
const Name = styled("span", {
  shouldForwardProp: (prop) => prop !== "tone",
})<{ tone?: Tone }>(({ tone }) => ({
  overflowWrap: "anywhere",
  textAlign: "left",
  color: tone === undefined ? undefined : STATE_TEXT[tone],
}));

// A status with no tone is a count, which reads quiet
const Status = styled("span", {
  shouldForwardProp: (prop) => prop !== "tone",
})<{ tone?: Tone }>(({ tone }) => ({
  color: tone === undefined ? "var(--jsb-muted)" : STATE_TEXT[tone],
  whiteSpace: "nowrap",
}));

const Detail = styled("small")(({ theme }) => ({
  gridColumn: "1 / -1",
  textAlign: "left",
  ...theme.typography.monoCaption,
  // The detail sits tight under the name
  lineHeight: "normal",
  color: "var(--jsb-muted)",
  overflowWrap: "anywhere",
}));

const SectionLabel = styled("h3")(({ theme }) => ({
  margin: "4px 0 0",
  ...theme.typography.paneLabel,
  color: "var(--jsb-faint)",
}));

const None = styled("p")(({ theme }) => ({
  margin: 0,
  ...theme.typography.monoSmall,
  color: "var(--jsb-faint)",
}));

/** Props of {@link RowList}. */
type RowListProps = {
  /** The rows to draw. */
  rows: readonly ConfigRow[];
  /** Called with the target of the row that the user chose. */
  onOpen: (target: Target) => void;
};

/**
 * A group of rows, each a button that opens its entry in the config.
 * @param props RowList props.
 * @param props.rows The rows to draw.
 * @param props.onOpen Called with the target of the row that the user chose.
 * @returns The rows, or a line that says there are none: a config that cannot be read, or has no entries, lists nothing.
 */
function RowList({ rows, onOpen }: Readonly<RowListProps>): ReactNode {
  if (rows.length === 0) {
    return <None>None</None>;
  }
  return (
    <List>
      {rows.map((row) => (
        <li key={row.key}>
          <RowButton onClick={() => onOpen(row.target)}>
            <Name tone={row.nameTone}>{row.name}</Name>
            <Status tone={row.statusTone}>{row.status}</Status>
            {row.detail === undefined ? null : <Detail>{row.detail}</Detail>}
          </RowButton>
        </li>
      ))}
    </List>
  );
}

/**
 * What the inspector shows for the config: its element types and its file categories, each with how many files it matches, and its policies: one row for each policy of the rule that the playground evaluates and one for its default, with how many dependencies each decided, and a row for each other rule that says it is not evaluated here. Every row opens its entry in the config.
 * @param props ConfigInspector props.
 * @param props.evaluation What the engine says about the sketch.
 * @param props.onOpen Called with the target of the row that the user chose.
 * @returns The content of the inspector.
 */
export function ConfigInspector({
  evaluation,
  onOpen,
}: Readonly<ConfigInspectorProps>): ReactNode {
  return (
    <Root data-testid={CONFIG_INSPECTOR_TEST_ID}>
      <SectionTitle>{CONFIG_PATH}</SectionTitle>
      <SectionLabel>Element types</SectionLabel>
      <RowList
        rows={evaluation.elementTypes.map(getElementTypeRow)}
        onOpen={onOpen}
      />
      <SectionLabel>File categories</SectionLabel>
      <RowList
        rows={evaluation.fileCategories.map(getFileCategoryRow)}
        onOpen={onOpen}
      />
      <SectionLabel>Policies</SectionLabel>
      <RowList rows={getPoliciesRows(evaluation)} onOpen={onOpen} />
    </Root>
  );
}
