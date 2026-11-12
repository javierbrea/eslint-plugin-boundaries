import type { ShareNotice } from "@/domains/share/helpers/shareOutcome";

/** Props of {@link ShareDialog}. */
export type ShareDialogProps = {
  /** What the share has to tell the user about. */
  readonly notice: ShareNotice;
  /** Whether the dialog is open. */
  readonly isOpen: boolean;
  /** Whether the last copy of the link from the dialog worked, for as long as its button says so. */
  readonly isCopiedAgain: boolean;
  /** Copies the link again, and tells whether it was copied. */
  readonly onCopyAgain: (link: string) => Promise<boolean>;
  /** Called when the user closes the dialog. */
  readonly onClose: () => void;
  /** Called when the dialog is gone from the page after it closed. */
  readonly onExited: () => void;
};
