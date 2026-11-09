import type { PendingLoad } from "@/domains/session/helpers/sketchLoad";

/** Props of {@link LoadState}. */
export type LoadStateProps = {
  /** The state of the load of the sketch. */
  load: PendingLoad;
  /** Called when the user asks to reset the sketch after a failure. The failure has no button without it. */
  onReset?: () => void;
};
