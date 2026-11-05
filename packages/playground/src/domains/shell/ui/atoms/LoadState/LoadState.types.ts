import type { PendingLoad } from "@/domains/session/helpers/sketchLoad";

/** Props of {@link LoadState}. */
export type LoadStateProps = {
  /** The state of the load of the sketch. */
  load: PendingLoad;
};
