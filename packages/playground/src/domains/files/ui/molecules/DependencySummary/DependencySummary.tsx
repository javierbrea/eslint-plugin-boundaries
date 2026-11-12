import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { countVerdicts } from "@/domains/evaluation/helpers/verdictCounts";
import { VerdictCount } from "@/domains/evaluation/ui/atoms/VerdictCount";
import { VERDICT_ICON_LABELS } from "@/domains/evaluation/ui/helpers/verdictText";
import { formatCount } from "@/shared/helpers/formatCount";
import { getCountTone } from "@/ui-kit/helpers/tone";

import { DEPENDENCY_SUMMARY_TEST_ID } from "./DependencySummary.constants";
import type { DependencySummaryProps } from "./DependencySummary.types";

// The counts wrap onto another line when the inspector is narrow, instead of overflowing it
const Root = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: "4px 12px",
  color: "var(--jsb-muted)",
  ...theme.typography.body2,
}));

/**
 * How many dependencies a file has and what the engine decided about them, such as `4 dependencies  ✓ 2  ✕ 1  – 1 not checked`. The disallowed ones are red with the cross when any is an error, and in the color of warnings with the triangle of their line when all of them are warnings. A count of 0 is left out, and so are all the counts while the dependencies are not evaluated. The allowed and disallowed counts are bare numbers, so their icons say `allowed`, `disallowed` or `disallowed, as a warning` to assistive technology, which reads `4 dependencies allowed 2 disallowed 1 1 not checked`. It has no outer spacing: the caller places it with `className`, such as `styled(DependencySummary)`.
 * @param props DependencySummary props.
 * @param props.results The dependencies of the file.
 * @param props.isEvaluated Whether the engine evaluated them.
 * @param props.className The class that places the summary.
 * @param props.testId The test id of the root element, in place of the default one.
 * @returns The summary line.
 */
export function DependencySummary({
  results,
  isEvaluated,
  className,
  testId = DEPENDENCY_SUMMARY_TEST_ID,
}: Readonly<DependencySummaryProps>): ReactNode {
  const counts = countVerdicts(results);
  const total = formatCount(counts.total, "dependency", "dependencies");
  const hasErrors = counts.errors > 0;
  const disallowedIcon = hasErrors ? "cross" : "warn";

  if (!isEvaluated) {
    return (
      <Root className={className} data-testid={testId}>
        <span>{total} · not evaluated</span>
      </Root>
    );
  }
  return (
    <Root className={className} data-testid={testId}>
      <span>{total}</span>
      {counts.allowed > 0 ? (
        <VerdictCount
          tone="ok"
          icon="check"
          iconLabel={VERDICT_ICON_LABELS.check}
        >
          {counts.allowed}
        </VerdictCount>
      ) : null}
      {counts.disallowed > 0 ? (
        <VerdictCount
          tone={getCountTone(hasErrors)}
          icon={disallowedIcon}
          iconLabel={VERDICT_ICON_LABELS[disallowedIcon]}
        >
          {counts.disallowed}
        </VerdictCount>
      ) : null}
      {counts.notChecked > 0 ? (
        <VerdictCount tone="faint" icon="skip">
          {counts.notChecked} not checked
        </VerdictCount>
      ) : null}
    </Root>
  );
}
