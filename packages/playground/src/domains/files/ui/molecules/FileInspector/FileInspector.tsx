import { styled } from "@mui/material/styles";
import { Fragment } from "react";
import type { ReactNode } from "react";

import type { DependencyResult } from "@/domains/evaluation/helpers/engine";
import { countVerdicts } from "@/domains/evaluation/helpers/verdictCounts";
import { VerdictCount } from "@/domains/evaluation/ui/atoms/VerdictCount";
import { formatValue } from "@/domains/files/ui/helpers/formatValue";
import type { DescribedValue } from "@/domains/files/ui/helpers/formatValue";
import { formatCount } from "@/shared/helpers/formatCount";
import { SectionTitle } from "@/ui-kit/atoms/SectionTitle";

import { FILE_INSPECTOR_TEST_ID } from "./FileInspector.constants";
import type { FileInspectorProps } from "./FileInspector.types";

// The inspector is a fragment of the content of the layout, whose grid places its parts: the root takes no box of its own, so that the test id has an element to be on
const Root = styled("div")({ display: "contents" });

const Box = styled("div")(({ theme }) => ({
  display: "grid",
  gap: 4,
  padding: "9px 10px",
  border: "1px solid var(--jsb-line)",
  borderRadius: "var(--jsb-radius)",
  ...theme.typography.monoSmall,
  lineHeight: 1.5,
}));

const FacetName = styled("b")(({ theme }) => ({
  fontWeight: theme.typography.fontWeightMedium,
  color: "var(--jsb-accent)",
}));

const Entries = styled("dl")({
  display: "grid",
  gridTemplateColumns: "76px minmax(0, 1fr)",
  gap: "1px 10px",
  margin: 0,
});

const Key = styled("dt")({ color: "var(--jsb-muted)" });

const Value = styled("dd", {
  shouldForwardProp: (prop) => prop !== "isNull",
})<{ isNull: boolean }>(({ isNull }) => ({
  margin: 0,
  overflowWrap: "anywhere",
  color: isNull ? "var(--jsb-faint)" : undefined,
}));

// The counts wrap onto another line when the inspector is narrow, instead of overflowing it
const Summary = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: "4px 12px",
  paddingTop: 2,
  color: "var(--jsb-muted)",
  ...theme.typography.body2,
}));

/** A property of a facet, named as the engine returns it. */
type FacetEntry = readonly [key: string, value: DescribedValue];

/** Props of {@link Facet}. */
type FacetProps = {
  /** Name of the facet of the description, such as `element`. */
  label: string;
  /** Its properties, in the order the inspector shows them. */
  entries: readonly FacetEntry[];
};

/**
 * One facet of the description of a file: its name over its properties as key and value.
 * @param props Facet props.
 * @param props.label Name of the facet.
 * @param props.entries Its properties.
 * @returns The facet.
 */
function Facet({ label, entries }: Readonly<FacetProps>): ReactNode {
  return (
    <Box>
      <FacetName>{label}</FacetName>
      <Entries>
        {entries.map(([key, value]) => (
          <Fragment key={key}>
            <Key>{key}</Key>
            <Value isNull={value === null}>{formatValue(value)}</Value>
          </Fragment>
        ))}
      </Entries>
    </Box>
  );
}

/** Props of {@link DependencySummary}. */
type DependencySummaryProps = {
  /** The dependencies of the file, with their verdicts. */
  results: readonly DependencyResult[];
  /** Whether the engine evaluated them. It does not while the config cannot be read, the rule options are invalid or the rule is off. */
  isEvaluated: boolean;
};

/**
 * How many dependencies a file has and what the engine decided about them, such as `4 dependencies  ✓ 2  ✕ 1  – 1 not checked`. A count of 0 is left out, and so are all the counts while the dependencies are not evaluated.
 * @param props DependencySummary props.
 * @param props.results The dependencies of the file.
 * @param props.isEvaluated Whether the engine evaluated them.
 * @returns The summary line.
 */
function DependencySummary({
  results,
  isEvaluated,
}: Readonly<DependencySummaryProps>): ReactNode {
  const counts = countVerdicts(results);
  const total = formatCount(counts.total, "dependency", "dependencies");

  if (!isEvaluated) {
    return (
      <Summary>
        <span>{total} · not evaluated</span>
      </Summary>
    );
  }
  return (
    <Summary>
      <span>{total}</span>
      {counts.allowed > 0 ? (
        <VerdictCount tone="ok" icon="check">
          {counts.allowed}
        </VerdictCount>
      ) : null}
      {counts.disallowed > 0 ? (
        <VerdictCount tone="bad" icon="cross">
          {counts.disallowed}
        </VerdictCount>
      ) : null}
      {counts.notChecked > 0 ? (
        <VerdictCount tone="faint" icon="skip">
          {counts.notChecked} not checked
        </VerdictCount>
      ) : null}
    </Summary>
  );
}

/**
 * What the inspector shows for a file: its path, the three facets of its description, `element`, `file` and `module`, with the names and values that the plugin gives them, and how many dependencies it has and what the engine decided about them. A file that the evaluation does not know, such as one that an edit just removed, has its path only.
 * @param props FileInspector props.
 * @param props.path Path of the file in focus.
 * @param props.evaluation What the engine says about the sketch.
 * @returns The content of the inspector.
 */
export function FileInspector({
  path,
  evaluation,
}: Readonly<FileInspectorProps>): ReactNode {
  const description = evaluation.files.get(path);

  return (
    <Root data-testid={FILE_INSPECTOR_TEST_ID}>
      <SectionTitle>{path}</SectionTitle>
      {description === undefined ? null : (
        <>
          <Facet
            label="element"
            entries={[
              ["types", description.element.types],
              ["path", description.element.path],
              ["captured", description.element.captured],
            ]}
          />
          <Facet
            label="file"
            entries={[["categories", description.file.categories]]}
          />
          <Facet
            label="module"
            entries={[["origin", description.module.origin]]}
          />
          <DependencySummary
            results={evaluation.dependencies.filter(
              ({ ref }) => ref.path === path
            )}
            isEvaluated={evaluation.notEvaluated === undefined}
          />
        </>
      )}
    </Root>
  );
}
