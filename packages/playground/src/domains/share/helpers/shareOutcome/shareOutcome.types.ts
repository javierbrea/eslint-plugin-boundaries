/** Why a sketch is not shared: nothing was copied, because the link would not open the sketch anywhere */
export type ShareRefusal = {
  /** Whether the sketch is too large for a link (`too-large`), or the link would fail to open it for another reason (`invalid`) */
  readonly kind: "too-large" | "invalid";
  /** Why, as a sentence that reads well after `The project cannot be shared: ` */
  readonly reason: string;
};

/** How sharing a sketch ended: the link was copied, it was copied but is long enough that some apps may cut it, it could not be copied, or it was not made because the sketch is refused */
export type ShareOutcome = "copied" | "long" | "failed" | ShareRefusal;
