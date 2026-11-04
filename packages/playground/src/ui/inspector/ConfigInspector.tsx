import ButtonBase from "@mui/material/ButtonBase";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import type {
  ElementTypeSummary,
  Evaluation,
  FileCategorySummary,
  RuleSummary,
  TextRange,
} from "../../engine";

import { Title } from "./Title";

/** How a status reads: the count of a row is quiet, what the user has to look at is not. */
type StatusTone = "muted" | "warn" | "bad";

const TONE_COLORS: Readonly<Record<StatusTone, string>> = {
  muted: "var(--jsb-muted)",
  warn: "var(--jsb-warn)",
  bad: "var(--jsb-bad)",
};

/** What a row of the config inspector says about an entry of the config. */
type ConfigRow = {
  /** Stable among the rows of a list. */
  key: string;
  /** The type, the category or the rule. */
  name: string;
  /** The color of the name, when the entry itself is what the user has to look at, such as an ignored descriptor. */
  nameTone?: StatusTone;
  /** At the end of the row: how many files or policies, or what is wrong. */
  status: string;
  tone: StatusTone;
  /** Below the name: its patterns, or what is wrong. */
  detail?: string;
  /** The entry in the config text. */
  range: TextRange;
};

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
const RowButton = styled(ButtonBase)({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "baseline",
  gap: "2px 8px",
  boxSizing: "border-box",
  width: "100%",
  padding: "7px 10px",
  textAlign: "left",
  font: "12px/1.45 var(--jsb-font-mono)",
  color: "var(--jsb-ink)",
  "&:hover": { backgroundColor: "var(--jsb-accent-soft)" },
  // The list clips what is outside it
  "&:focus-visible": { outlineOffset: -2 },
});

// A name longer than the row still wraps, so that a long pattern never overflows it
const Name = styled("span", {
  shouldForwardProp: (prop) => prop !== "tone",
})<{ tone?: StatusTone }>(({ tone }) => ({
  overflowWrap: "anywhere",
  textAlign: "left",
  color: tone === undefined ? undefined : TONE_COLORS[tone],
}));

const Status = styled("span", {
  shouldForwardProp: (prop) => prop !== "tone",
})<{ tone: StatusTone }>(({ tone }) => ({
  // At the end of its line, whether it shares the line with the name or not
  marginLeft: "auto",
  color: TONE_COLORS[tone],
  whiteSpace: "nowrap",
}));

const Detail = styled("small")({
  flexBasis: "100%",
  textAlign: "left",
  font: "11.5px var(--jsb-font-mono)",
  color: "var(--jsb-muted)",
  overflowWrap: "anywhere",
});

const SectionLabel = styled("h3")({
  margin: "4px 0 0",
  font: "500 10.5px/1 var(--jsb-font-mono)",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--jsb-faint)",
});

const None = styled("p")({
  margin: 0,
  font: "12px/1.45 var(--jsb-font-mono)",
  color: "var(--jsb-faint)",
});

/**
 * Writes a count with its noun.
 * @param count The count.
 * @param singular The noun for one.
 * @param plural The noun for any other count.
 * @returns The count and the noun, such as `1 file` or `3 files`.
 */
function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Describes an element descriptor of the settings as a row.
 * @param summary The summary of the descriptor.
 * @param summary.index Position of the descriptor in the settings, which keys the row.
 * @param summary.type Its type, or `#<index>` when it has none: the name of the row.
 * @param summary.patterns Its patterns, shown below the name.
 * @param summary.files How many files of the sketch it matches.
 * @param summary.ignored Whether a diagnostic says it is invalid and ignored.
 * @param summary.range Where the descriptor is in the config text, and the line that an ignored one names.
 * @returns The row. An ignored descriptor says so and where it is, instead of its files and its patterns.
 */
function toElementTypeRow({
  index,
  type,
  patterns,
  files,
  ignored,
  range,
}: ElementTypeSummary): ConfigRow {
  const key = `element-${index}`;
  return ignored
    ? {
        key,
        name: type,
        nameTone: "warn",
        status: "ignored",
        tone: "warn",
        detail: `invalid descriptor, line ${range.line}`,
        range,
      }
    : {
        key,
        name: type,
        status: formatCount(files, "file", "files"),
        tone: "muted",
        detail: patterns.join(", "),
        range,
      };
}

/**
 * Describes a file category of the settings as a row.
 * @param summary The summary of the category.
 * @param summary.index Position of the descriptor in the settings, which keys the row.
 * @param summary.category Its category: the name of the row.
 * @param summary.patterns Its patterns, shown below the name.
 * @param summary.files How many files of the sketch it matches.
 * @param summary.range Where the descriptor is in the config text.
 * @returns The row.
 */
function toFileCategoryRow({
  index,
  category,
  patterns,
  files,
  range,
}: FileCategorySummary): ConfigRow {
  return {
    key: `category-${index}`,
    name: category,
    status: formatCount(files, "file", "files"),
    tone: "muted",
    detail: patterns.join(", "),
    range,
  };
}

/**
 * Describes a rule of the plugin as a row.
 * @param summary The summary of the rule.
 * @param summary.name The rule as written, which is the name of the row and keys it.
 * @param summary.policies How many policies its options have.
 * @param summary.valid Whether its options pass the rule schema.
 * @param summary.range Where the rule is in the config text.
 * @returns The row. A rule whose options are invalid is not evaluated, and says so.
 */
function toRuleRow({
  name: ruleName,
  policies,
  valid,
  range,
}: RuleSummary): ConfigRow {
  const policyCount = formatCount(policies, "policy", "policies");
  return valid
    ? {
        key: ruleName,
        name: ruleName,
        status: policyCount,
        tone: "muted",
        range,
      }
    : {
        key: ruleName,
        name: ruleName,
        status: "not evaluated",
        tone: "bad",
        detail: `${policyCount} · invalid options`,
        range,
      };
}

/** Props of {@link RowList}. */
type RowListProps = {
  /** The rows to draw. */
  rows: readonly ConfigRow[];
  /** Called with the range of the row that the user chose. */
  onReveal: (range: TextRange) => void;
};

/**
 * A group of rows, each a button that reveals its entry in the config.
 * @param props RowList props.
 * @param props.rows The rows to draw.
 * @param props.onReveal Called with the range of the row that the user chose.
 * @returns The rows, or a line that says there are none: a config that cannot be read, or has no entries, lists nothing.
 */
function RowList({ rows, onReveal }: Readonly<RowListProps>): ReactNode {
  if (rows.length === 0) {
    return <None>None</None>;
  }
  return (
    <List>
      {rows.map((row) => (
        <li key={row.key}>
          <RowButton onClick={() => onReveal(row.range)}>
            <Name tone={row.nameTone}>{row.name}</Name>
            <Status tone={row.tone}>{row.status}</Status>
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
  /** Called with the range of the entry of the row that the user chose. */
  onReveal: (range: TextRange) => void;
};

/**
 * What the inspector shows for the config: its element types, its file categories and its policies, each with how many files or policies it has and where it is written.
 * @param props ConfigInspector props.
 * @param props.evaluation What the engine says about the sketch.
 * @param props.onReveal Called with the range of the entry of the row that the user chose.
 * @returns The content of the inspector.
 */
export function ConfigInspector({
  evaluation,
  onReveal,
}: Readonly<ConfigInspectorProps>): ReactNode {
  return (
    <>
      <Title>eslint.config.js</Title>
      <SectionLabel>Element types</SectionLabel>
      <RowList
        rows={evaluation.elementTypes.map((summary) =>
          toElementTypeRow(summary)
        )}
        onReveal={onReveal}
      />
      <SectionLabel>File categories</SectionLabel>
      <RowList
        rows={evaluation.fileCategories.map((summary) =>
          toFileCategoryRow(summary)
        )}
        onReveal={onReveal}
      />
      <SectionLabel>Policies</SectionLabel>
      <RowList
        rows={evaluation.rules.map((summary) => toRuleRow(summary))}
        onReveal={onReveal}
      />
    </>
  );
}
