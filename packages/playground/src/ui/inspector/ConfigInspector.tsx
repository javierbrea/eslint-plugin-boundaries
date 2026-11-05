import ButtonBase from "@mui/material/ButtonBase";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import type { Evaluation } from "@/domains/evaluation/helpers/engine";
import { CONFIG_PATH } from "@/domains/project/helpers/sketch";
import type { Target } from "@/ui/state";
import { SectionTitle } from "@/ui-kit/atoms/SectionTitle";
import { TONE_COLORS } from "@/ui-kit/helpers/tone";
import type { Tone } from "@/ui-kit/helpers/tone";

import {
  getElementTypeRow,
  getFileCategoryRow,
  getRuleRow,
} from "./ConfigRows";
import type { ConfigRow } from "./ConfigRows.types";

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

// The status goes under the name when both do not fit, instead of breaking the name in the middle of a word: at the default width of the inspector, a rule name and `not evaluated` take all the room there is
const RowButton = styled(ButtonBase)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "baseline",
  gap: "2px 8px",
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
  color: tone === undefined ? undefined : TONE_COLORS[tone],
}));

// A status with no tone is a count, which reads quiet
const Status = styled("span", {
  shouldForwardProp: (prop) => prop !== "tone",
})<{ tone?: Tone }>(({ tone }) => ({
  // At the end of its line, whether it shares the line with the name or not
  marginLeft: "auto",
  color: tone === undefined ? "var(--jsb-muted)" : TONE_COLORS[tone],
  whiteSpace: "nowrap",
}));

const Detail = styled("small")(({ theme }) => ({
  flexBasis: "100%",
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

/** Props of {@link ConfigInspector}. */
type ConfigInspectorProps = {
  /** What the engine says about the sketch. */
  evaluation: Evaluation;
  /** Called with the target of the row that the user chose: its entry in the config. */
  onOpen: (target: Target) => void;
};

/**
 * What the inspector shows for the config: its element types, its file categories and its policies, each with how many files or policies it has and where it is written.
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
    <>
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
      <RowList rows={evaluation.rules.map(getRuleRow)} onOpen={onOpen} />
    </>
  );
}
