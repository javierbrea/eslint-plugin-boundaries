import type { Sketch } from "@/contract";
import type { Example } from "@/domains/examples/data/examples";
import type { MakeLink } from "@/domains/share/modules/hooks/useShareLink";

/** The control of the top bar that takes the keyboard focus when it is first rendered: the picker of examples, or Reset. */
export type ShellTopBarFocus = "examples" | "reset";

/** Props of {@link ShellTopBar}. What the bar asks of the host comes as callbacks, and the ones that replace the sketch get the sketch that is on screen, so that the host can tell whether the replacement would lose the edits. */
export type ShellTopBarProps = {
  /** The URL of the playground guide, which the help links to. The help draws no link to it without it. */
  readonly guideUrl?: string;
  /** The URL of the Quick start guide, which the help links to. The help draws no link to it without it. */
  readonly quickStartUrl?: string;
  /** Called when the user asks to reset the sketch, with the sketch on screen. */
  readonly onReset: (sketch: Sketch) => void;
  /** Called when the user picks an example, with the example and the sketch on screen. */
  readonly onSelectExample: (example: Example, sketch: Sketch) => void;
  /** Makes the link that opens a sketch, which Share copies. The bar has no Share without it. */
  readonly makeLink?: MakeLink;
  /** The control that takes the keyboard focus when the bar is first rendered. A host that shows a new shell in place of the one in which the user pressed Reset or picked an example sets it, since the control that had the focus goes with the old shell. No control takes it when it is unset. */
  readonly initialFocus?: ShellTopBarFocus;
};
