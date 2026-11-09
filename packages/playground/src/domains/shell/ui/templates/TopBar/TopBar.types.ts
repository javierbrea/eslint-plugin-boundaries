import type { ReactNode } from "react";

import type { Tone } from "@/ui-kit/helpers/tone";

/** Props of {@link TopBar}. */
export type TopBarProps = {
  /** How many files the sketch has. */
  readonly files: number;
  /** How many dependencies the sketch has, whether or not they are evaluated. */
  readonly dependencies: number;
  /** How many problems the sketch has: those of the config and the lines of text mode that could not be read. */
  readonly problems: number;
  /** The color of the number of problems: `bad` when any is an error, `warn` when they are all warnings. */
  readonly tone: Tone;
  /** Whether the config has errors. The status says so instead of counting the problems, and its dot turns red. */
  readonly configHasErrors: boolean;
  /** What goes before the status, such as the picker of examples. */
  readonly start?: ReactNode;
  /** What goes at the end of the bar, after the space that the status leaves, such as the actions. */
  readonly end?: ReactNode;
  /** The test id of the root element, in place of the default one: the component that is the bar gives its own. */
  readonly testId?: string;
};
