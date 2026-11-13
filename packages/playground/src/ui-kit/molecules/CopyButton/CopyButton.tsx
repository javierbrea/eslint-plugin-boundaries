import Button from "@mui/material/Button";
import { keyframes, styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { Icon } from "@/ui-kit/atoms/Icon";

import {
  COPY_BUTTON_COPIED_LABEL,
  COPY_BUTTON_TEST_ID,
} from "./CopyButton.constants";
import type { CopyButtonProps } from "./CopyButton.types";

const REDUCED_MOTION = "@media (prefers-reduced-motion: reduce)";

// The green of a copy that worked. 15% of `--jsb-ink` darkens `--jsb-ok` in the light scheme and lightens it in the dark one, so that the text of the button, `--jsb-accent-ink`, passes 4.5:1 on it in both
const COPIED_BACKGROUND =
  "color-mix(in srgb, var(--jsb-ok) 85%, var(--jsb-ink))";

// A ring of that green leaves the edge of the button and fades as it grows
const COPIED_PULSE = keyframes({
  from: {
    boxShadow: "0 0 0 0 color-mix(in srgb, var(--jsb-ok) 55%, transparent)",
  },
  to: {
    boxShadow: "0 0 0 6px color-mix(in srgb, var(--jsb-ok) 0%, transparent)",
  },
});

// The face that leaves slides out of the button and is cut by it. The button turns green with the faces and sends a ring out, then takes longer to fade back to its color, while the label comes back. The color is not motion, so it fades for every user, and only the ring stops for a user who asks for less motion
const Root = styled(Button, {
  shouldForwardProp: (prop) => prop !== "isCopied",
})<{ isCopied: boolean }>(({ isCopied }) => ({
  overflow: "hidden",
  ...(isCopied
    ? {
        backgroundColor: COPIED_BACKGROUND,
        transition: "background-color 180ms var(--jsb-ease)",
        animation: `${COPIED_PULSE} 600ms var(--jsb-ease)`,
        [REDUCED_MOTION]: { animation: "none" },
      }
    : { transition: "background-color 400ms var(--jsb-ease)" }),
}));

// Both faces sit in the same cell, so the button is always as wide as the wider one and nothing around it moves when they swap
const Faces = styled("span")({ display: "grid" });

const Face = styled("span", {
  shouldForwardProp: (prop) => prop !== "isShown" && prop !== "shift",
})<{ isShown: boolean; shift: string }>(({ isShown, shift }) => ({
  gridArea: "1 / 1",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  opacity: isShown ? 1 : 0,
  // A hidden face waits above the button (the label, which leaves upwards) or below it (the confirmation, which comes from below)
  transform: isShown ? "none" : `translateY(${shift})`,
  transition: "opacity 180ms var(--jsb-ease), transform 180ms var(--jsb-ease)",
  [REDUCED_MOTION]: { transition: "none" },
}));

// The check grows into place a moment after its face starts to come in, past its size and back
const Check = styled("span", {
  shouldForwardProp: (prop) => prop !== "isShown",
})<{ isShown: boolean }>(({ isShown }) => ({
  display: "inline-flex",
  transform: isShown ? "none" : "scale(0.5)",
  transition: "transform 240ms cubic-bezier(0.3, 1.6, 0.5, 1) 60ms",
  [REDUCED_MOTION]: { transition: "none" },
}));

/**
 * A contained button that copies something and says so: while `isCopied`, the button turns green and a check and `Copied` take the place of its icon and label, then its color, its icon and its label come back. Both faces are always laid out in the same place, so the button never changes its width. Its accessible name is always the label: the caller tells screen readers that the copy worked, such as with a live region.
 * @param props CopyButton props.
 * @param props.label What the button says, which is also its accessible name.
 * @param props.icon The icon before the label, if any.
 * @param props.isCopied Whether the button confirms that it copied.
 * @param props.buttonRef Gives the caller the element of the button.
 * @param props.onClick Called when the user presses the button.
 * @param props.testId The test id of the root element, in place of the default one.
 * @returns The button.
 */
export function CopyButton({
  label,
  icon,
  isCopied,
  buttonRef,
  onClick,
  testId = COPY_BUTTON_TEST_ID,
}: Readonly<CopyButtonProps>): ReactNode {
  return (
    <Root
      ref={buttonRef}
      variant="contained"
      isCopied={isCopied}
      onClick={onClick}
      data-testid={testId}
    >
      <Faces>
        <Face isShown={!isCopied} shift="-45%">
          {icon === undefined ? null : <Icon name={icon} />}
          {label}
        </Face>
        <Face isShown={isCopied} shift="45%" aria-hidden>
          <Check isShown={isCopied}>
            <Icon name="check" />
          </Check>
          {COPY_BUTTON_COPIED_LABEL}
        </Face>
      </Faces>
    </Root>
  );
}
