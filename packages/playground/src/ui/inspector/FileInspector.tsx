import { styled } from "@mui/material/styles";
import { Fragment } from "react";
import type { ReactNode } from "react";

import type { Evaluation } from "../../engine";

import { formatValue } from "./FormatValue";
import type { DescribedValue } from "./FormatValue.types";
import { Title } from "./Title";

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

/** Props of {@link FileInspector}. */
type FileInspectorProps = {
  /** Path of the file in focus. */
  path: string;
  /** What the engine says about the sketch. */
  evaluation: Evaluation;
};

/**
 * What the inspector shows for a file: its path and the three facets of its description, `element`, `file` and `module`, with the names and values that the plugin gives them. A file that the evaluation does not know, such as one that an edit just removed, has its path only.
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
    <>
      <Title>{path}</Title>
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
        </>
      )}
    </>
  );
}
