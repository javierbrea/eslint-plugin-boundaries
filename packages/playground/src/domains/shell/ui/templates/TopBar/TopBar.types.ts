import type { ReactNode } from "react";

import type { StateTone, Tone } from "@/ui-kit/helpers/tone";

/** Props of {@link TopBar}. */
export type TopBarProps = {
  /** How many files the sketch has. */
  readonly files: number;
  /** How many dependencies the sketch has, whether or not they are evaluated. */
  readonly dependencies: number;
  /** How many problems the sketch has: those of the config, the lines of text mode that could not be read and the failing dependencies. `undefined` before they are known, when the status says nothing after the dependencies. */
  readonly problems: number | undefined;
  /** The color of the number of problems: `bad` when any is an error, `warn` when they are all warnings. */
  readonly tone: Tone;
  /** Whether the config has errors. The status says so instead of counting the problems, and its dot turns red. */
  readonly configHasErrors: boolean;
  /** What the status says about the evaluation, such as that it runs, in place of the problems, with the tone of the text and of the dot. `undefined` when it says the problems. */
  readonly evaluation?: { readonly text: string; readonly tone: StateTone };
  /** What goes before the status, such as the picker of examples. */
  readonly start?: ReactNode;
  /** What goes at the end of the bar, after the space that the status leaves, such as the actions. */
  readonly end?: ReactNode;
  /** The test id of the root element, in place of the default one: the component that is the bar gives its own. */
  readonly testId?: string;
};
