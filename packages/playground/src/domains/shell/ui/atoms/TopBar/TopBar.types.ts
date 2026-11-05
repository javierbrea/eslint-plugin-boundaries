import type { Tone } from "@/ui-kit/helpers/tone";

/** Props of {@link TopBar}. */
export type TopBarProps = {
  /** How many files the sketch has. */
  readonly files: number;
  /** How many problems the sketch has: those of the config and the lines of text mode that could not be read. */
  readonly problems: number;
  /** The color of the number of problems: `bad` when any is an error, `warn` when they are all warnings. */
  readonly tone: Tone;
  /** Whether the config has errors. The status says so instead of counting the problems, and its dot turns red. */
  readonly configHasErrors: boolean;
  /** The test id of the root element. The bar renders none when it is unset: the component that is the bar sets its own. */
  readonly testId?: string;
};
