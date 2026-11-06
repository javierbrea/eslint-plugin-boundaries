import { useMemo } from "react";

import { getTextProblems } from "@/domains/problems/helpers/problemSelectors";
import type { TextProblem } from "@/domains/project/helpers/sketch";
import { useCapabilities, useTextDraft } from "@/domains/session/data/store";

/**
 * Reads the lines of text mode that cannot be read, derived from the draft. The dependency lines are problems only when the host lets the user edit dependencies, as the session reads them.
 * @returns The lines, in order; the same array while the draft and the capability do not change.
 */
export function useTextProblems(): readonly TextProblem[] {
  const draft = useTextDraft();
  const { editDependencies } = useCapabilities();

  return useMemo(
    () => getTextProblems(draft, editDependencies),
    [draft, editDependencies]
  );
}
