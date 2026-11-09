import type { Example } from "@/domains/examples/data/examples";
import type { ShellTopBarFocus } from "@/domains/shell/modules/ShellTopBar";

/** What the user asked to put in the place of the sketch on screen: the sketch of the source, or an example. */
export type Replacement =
  | { readonly kind: "reset" }
  | { readonly kind: "example"; readonly example: Example };

/** The control that takes the keyboard focus in the shell that follows a replacement: the control that had it went with the old shell. It is for the first sketch that comes on screen after the replacement was asked for, and for no other. */
export type FocusRequest = {
  /** The control of the top bar of the new shell that takes the focus. */
  readonly target: ShellTopBarFocus;
  /** The number of the sketch on screen when the replacement was asked for. */
  readonly after: number;
  /** The number of the first sketch that came on screen after that, which is the one that takes the focus. It is unset until that sketch comes. */
  readonly shell?: number;
};
