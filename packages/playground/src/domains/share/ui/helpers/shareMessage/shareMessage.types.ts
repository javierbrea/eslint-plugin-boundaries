/** What the message that follows a share says and how it looks. */
export type ShareMessageView = {
  /** The words of the message. */
  readonly text: string;
  /** The color of the words. */
  readonly color: string;
  /** Whether a check icon, in the color of what is allowed, comes before the words. */
  readonly hasCheck: boolean;
};
