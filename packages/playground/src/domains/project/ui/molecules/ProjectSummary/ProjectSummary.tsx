import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { countVerdicts } from "@/domains/evaluation/helpers/verdictCounts";
import { VerdictCount } from "@/domains/evaluation/ui/atoms/VerdictCount";
import { getCountTone } from "@/domains/problems/ui/helpers/problemItems";
import { SectionTitle } from "@/ui-kit/atoms/SectionTitle";
import { TONE_COLORS } from "@/ui-kit/helpers/tone";
import type { Tone } from "@/ui-kit/helpers/tone";

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

const Count = styled("b", {
  shouldForwardProp: (prop) => prop !== "tone",
})<{ tone?: Tone }>(({ theme, tone }) => ({
  ...theme.typography.figure,
  color: tone === undefined ? undefined : TONE_COLORS[tone],
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
 * What the inspector shows when nothing is open: the numbers of the sketch in a grid of two columns (its files, dependencies, element types, file categories, the policies of the evaluated rule and the disallowed dependencies, which are in the color of errors when there is any and in the one of warnings when all of them are warnings), and under it how many dependencies were allowed and how many are not checked, or that they are not evaluated.
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
  // The only number that is in the color of errors or of warnings, and only when it is not 0
  const numbers: { label: string; count: number; tone?: Tone }[] = [
    { label: "files", count: files.size },
    { label: "dependencies", count: verdicts.total },
    { label: "element types", count: elementTypes.length },
    { label: "file categories", count: fileCategories.length },
    {
      label: "policies",
      // The inspector of the config lists the policies of the evaluated rule only
      count: rules.find(({ evaluated }) => evaluated)?.policies ?? 0,
    },
    {
      label: "disallowed",
      count: verdicts.disallowed,
      tone:
        verdicts.disallowed > 0 ? getCountTone(verdicts.errors > 0) : undefined,
    },
  ];

  return (
    <Root data-testid={PROJECT_SUMMARY_TEST_ID}>
      <SectionTitle>{PROJECT_SUMMARY_TITLE}</SectionTitle>
      <Numbers>
        {numbers.map(({ label, count, tone }) => (
          <Tile key={label}>
            <Count tone={tone}>{count}</Count>
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
