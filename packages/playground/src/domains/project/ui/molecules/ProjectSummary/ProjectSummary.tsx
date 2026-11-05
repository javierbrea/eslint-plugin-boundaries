import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { SectionTitle } from "@/ui-kit/atoms/SectionTitle";

import {
  PROJECT_SUMMARY_TEST_ID,
  PROJECT_SUMMARY_TITLE,
} from "./ProjectSummary.constants";
import type { ProjectSummaryProps } from "./ProjectSummary.types";

// The summary is a fragment of the content of the layout, whose grid places its parts: the root takes no box of its own, so that the test id has an element to be on
const Root = styled("div")({ display: "contents" });

const Numbers = styled("div")({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  border: "1px solid var(--jsb-line)",
  borderRadius: "var(--jsb-radius)",
});

const Tile = styled("div")({
  display: "grid",
  gap: 2,
  padding: "10px 12px",
  "&:nth-of-type(odd)": { borderRight: "1px solid var(--jsb-line)" },
  "&:nth-of-type(n + 3)": { borderTop: "1px solid var(--jsb-line)" },
});

const Count = styled("b")(({ theme }) => theme.typography.figure);

const Label = styled("span")(({ theme }) => ({
  ...theme.typography.caption,
  color: "var(--jsb-muted)",
}));

/**
 * What the inspector shows when nothing is open: the numbers of the sketch. Phase 6 adds the dependencies and the disallowed ones, which makes the grid 2×3.
 * @param props ProjectSummary props.
 * @param props.evaluation What the engine says about the sketch.
 * @returns The content of the inspector.
 */
export function ProjectSummary({
  evaluation,
}: Readonly<ProjectSummaryProps>): ReactNode {
  const { files, elementTypes, fileCategories, rules } = evaluation;
  const numbers = [
    { label: "files", count: files.size },
    { label: "element types", count: elementTypes.length },
    { label: "file categories", count: fileCategories.length },
    {
      label: "policies",
      count: rules.reduce((total, { policies }) => total + policies, 0),
    },
  ];

  return (
    <Root data-testid={PROJECT_SUMMARY_TEST_ID}>
      <SectionTitle>{PROJECT_SUMMARY_TITLE}</SectionTitle>
      <Numbers>
        {numbers.map(({ label, count }) => (
          <Tile key={label}>
            <Count>{count}</Count>
            <Label>{label}</Label>
          </Tile>
        ))}
      </Numbers>
    </Root>
  );
}
