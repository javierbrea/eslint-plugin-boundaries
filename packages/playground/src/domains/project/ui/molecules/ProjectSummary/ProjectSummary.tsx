import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { countVerdicts } from "@/domains/evaluation/helpers/verdictCounts";
import { VerdictCount } from "@/domains/evaluation/ui/atoms/VerdictCount";
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

const Count = styled("b")<{ isBad?: boolean }>(({ theme, isBad }) => ({
  ...theme.typography.figure,
  color: isBad ? "var(--jsb-bad)" : undefined,
}));

const Label = styled("span")(({ theme }) => ({
  ...theme.typography.caption,
  color: "var(--jsb-muted)",
}));

// The same line as the summary of a file, so it reads as the one thing: the verdicts of the dependencies
const Verdicts = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: "4px 12px",
  paddingTop: 2,
  color: "var(--jsb-muted)",
  ...theme.typography.body2,
}));

/**
 * What the inspector shows when nothing is open: the numbers of the sketch in a grid of two columns (its files, dependencies, element types, file categories, policies and disallowed dependencies, which are in the color of errors when there is any), and under it how many dependencies were allowed and how many are not checked, or that they are not evaluated.
 * @param props ProjectSummary props.
 * @param props.evaluation What the engine says about the sketch.
 * @returns The content of the inspector.
 */
export function ProjectSummary({
  evaluation,
}: Readonly<ProjectSummaryProps>): ReactNode {
  const { files, elementTypes, fileCategories, rules, notEvaluated } =
    evaluation;
  const verdicts = countVerdicts(evaluation.dependencies);
  // The only number that is in the color of errors, and only when it is not 0
  const numbers: { label: string; count: number; isBad?: boolean }[] = [
    { label: "files", count: files.size },
    { label: "dependencies", count: verdicts.total },
    { label: "element types", count: elementTypes.length },
    { label: "file categories", count: fileCategories.length },
    {
      label: "policies",
      count: rules.reduce((total, { policies }) => total + policies, 0),
    },
    {
      label: "disallowed",
      count: verdicts.disallowed,
      isBad: verdicts.disallowed > 0,
    },
  ];

  return (
    <Root data-testid={PROJECT_SUMMARY_TEST_ID}>
      <SectionTitle>{PROJECT_SUMMARY_TITLE}</SectionTitle>
      <Numbers>
        {numbers.map(({ label, count, isBad }) => (
          <Tile key={label}>
            <Count isBad={isBad}>{count}</Count>
            <Label>{label}</Label>
          </Tile>
        ))}
      </Numbers>
      <Verdicts>
        {notEvaluated === undefined ? (
          <>
            <VerdictCount tone="ok" icon="check">
              {verdicts.allowed} allowed
            </VerdictCount>
            <VerdictCount tone="faint" icon="skip">
              {verdicts.notChecked} not checked
            </VerdictCount>
          </>
        ) : (
          <span>not evaluated</span>
        )}
      </Verdicts>
    </Root>
  );
}
