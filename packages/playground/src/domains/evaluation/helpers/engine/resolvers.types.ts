import type { SourceResolver } from "@/domains/project/helpers/sketch";

import type { ConfigProblem } from "./engine.types";

/** The resolvers of a config, and the warnings about what the playground does not run of them */
export type ResolversRead = {
  /** The resolvers that the sources are written and read with, in the order ESLint tries them. Never empty */
  readonly resolvers: readonly SourceResolver[];
  /** A warning for each entry of the setting that the playground does not run, placed at the entry */
  readonly problems: readonly ConfigProblem[];
};
