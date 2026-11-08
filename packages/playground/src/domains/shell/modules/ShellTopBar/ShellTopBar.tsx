import type { ReactNode } from "react";

import { useProblemSummary } from "@/domains/problems/modules/hooks/useProblemSummary";
import { useSessionSelector } from "@/domains/session/data/store";
import { TopBar } from "@/domains/shell/ui/atoms/TopBar";
import { getCountTone } from "@/ui-kit/helpers/tone";

import { SHELL_TOP_BAR_TEST_ID } from "./ShellTopBar.constants";

/**
 * The top bar of the instance, with the numbers of the store: how many files and dependencies the sketch has and how many problems.
 * @returns The bar.
 */
export function ShellTopBar(): ReactNode {
  const files = useSessionSelector((state) => state.evaluation.files.size);
  const dependencies = useSessionSelector(
    (state) => state.evaluation.sketch.dependencies.length
  );
  const { total, hasErrors, configHasErrors } = useProblemSummary();

  return (
    <TopBar
      files={files}
      dependencies={dependencies}
      problems={total}
      tone={getCountTone(hasErrors)}
      configHasErrors={configHasErrors}
      testId={SHELL_TOP_BAR_TEST_ID}
    />
  );
}
