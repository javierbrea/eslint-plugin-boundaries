import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { VISUALLY_HIDDEN } from "@/ui-kit/helpers/theme";

import { COPIED_ANNOUNCEMENT_TEXT } from "./CopiedAnnouncement.constants";
import type { CopiedAnnouncementProps } from "./CopiedAnnouncement.types";

// Read by screen readers and never drawn: the button beside it shows the copy
const Region = styled("span")(VISUALLY_HIDDEN);

/**
 * Tells screen readers that a link was copied, while the button that copied it shows a check: the accessible name of that button stays its label, so this region is what announces the copy. The region, which is polite so that it never interrupts, is always there, so that screen readers pick up the text that comes into it.
 * @param props CopiedAnnouncement props.
 * @param props.isCopied Whether the button beside it confirms that it copied the link.
 * @returns The live region.
 */
export function CopiedAnnouncement({
  isCopied,
}: Readonly<CopiedAnnouncementProps>): ReactNode {
  return (
    <Region role="status" aria-live="polite">
      {isCopied ? COPIED_ANNOUNCEMENT_TEXT : null}
    </Region>
  );
}
