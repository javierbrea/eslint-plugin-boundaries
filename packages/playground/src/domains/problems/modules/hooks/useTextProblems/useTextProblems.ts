import { useMemo } from "react";

import { getTextProblems } from "@/domains/problems/helpers/problemSelectors";
import type { TextProblem } from "@/domains/project/helpers/sketch";
import { useTextDraft } from "@/domains/session/data/store";

/**
 * Reads the lines of text mode that cannot be read, derived from the draft.
 * @returns The lines, in order; the same array while the draft does not change.
 */
export function useTextProblems(): readonly TextProblem[] {
  const draft = useTextDraft();

  return useMemo(() => getTextProblems(draft), [draft]);
}
