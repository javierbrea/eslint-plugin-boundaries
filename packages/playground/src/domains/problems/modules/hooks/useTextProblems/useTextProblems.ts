import { useMemo } from "react";

import { getTextProblems } from "@/domains/problems/helpers/problemSelectors";
import type { TextProblem } from "@/domains/project/helpers/sketch";
import {
  useCapabilities,
  useSessionSelector,
  useTextDraft,
} from "@/domains/session/data/store";

/**
 * Reads the lines of text mode that cannot be read, derived from the draft. The dependency lines are problems only when the host lets the user edit dependencies, and their sources are read with the resolvers of the evaluation, as the session reads them.
 * @returns The lines, in order; the same array while the draft, the capability and the resolvers do not change.
 */
export function useTextProblems(): readonly TextProblem[] {
  const draft = useTextDraft();
  const { editDependencies } = useCapabilities();
  const resolvers = useSessionSelector((state) => state.evaluation.resolvers);

  return useMemo(
    () => getTextProblems(draft, editDependencies, resolvers),
    [draft, editDependencies, resolvers]
  );
}
