import { styled } from "@mui/material/styles";
import { useId } from "react";
import type { ReactNode } from "react";

import { Icon } from "@/ui-kit/atoms/Icon";
import { FOCUS_RING, HOVER_BACKGROUND } from "@/ui-kit/helpers/theme";

import { DISCLOSURE_TEST_ID } from "./Disclosure.constants";
import type { DisclosureProps, DisclosureVariant } from "./Disclosure.types";

/** The variant the styled parts below read. */
type VariantProps = { variant: DisclosureVariant };

const isNotVariant = (prop: PropertyKey): boolean => prop !== "variant";

// A box is framed and takes the mono text of the inspector; a section is the bare block that the box sits in
const Root = styled("div", {
  shouldForwardProp: isNotVariant,
})<VariantProps>(({ theme, variant }) => ({
  minWidth: 0,
  ...(variant === "box" && {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "var(--jsb-line)",
    borderRadius: "var(--jsb-radius)",
    ...theme.typography.monoSmall,
    lineHeight: 1.5,
  }),
}));

// The whole header is the button, so that the chevron, the label and the summary all fold the body. The ring sits inside it, where the frame of a box and the scroll of the pane cannot clip it
const Header = styled("button", {
  shouldForwardProp: isNotVariant,
})<VariantProps>(({ variant }) => ({
  display: "flex",
  alignItems: variant === "box" ? "center" : "baseline",
  gap: variant === "box" ? 6 : 8,
  boxSizing: "border-box",
  width: "100%",
  minWidth: 0,
  margin: 0,
  padding: variant === "box" ? "6px 10px" : "4px 0",
  border: 0,
  borderRadius: variant === "box" ? "var(--jsb-radius)" : 0,
  background: "none",
  color: "inherit",
  fontFamily: "inherit",
  fontSize: "inherit",
  fontWeight: "inherit",
  lineHeight: "inherit",
  textAlign: "left",
  cursor: "pointer",
  "&:hover": { background: HOVER_BACKGROUND },
  "&:focus-visible": { outline: FOCUS_RING, outlineOffset: -2 },
}));

// The icon takes the color of its wrapper, and the wrapper turns it a quarter when the body is shown
const Chevron = styled("span", {
  shouldForwardProp: (prop) => prop !== "isOpen",
})<{ isOpen: boolean }>(({ isOpen }) => ({
  display: "inline-flex",
  alignSelf: "center",
  color: "var(--jsb-faint)",
  transform: isOpen ? "rotate(90deg)" : "none",
  transition: "transform 120ms var(--jsb-ease)",
}));

const Label = styled("span", {
  shouldForwardProp: isNotVariant,
})<VariantProps>(({ theme, variant }) => ({
  flex: "none",
  ...(variant === "box"
    ? {
        fontWeight: theme.typography.fontWeightMedium,
        color: "var(--jsb-accent)",
      }
    : { ...theme.typography.paneLabel, color: "var(--jsb-muted)" }),
}));

// A box puts its digest at the end of the header, and a section follows its label with the path
const Summary = styled("span", {
  shouldForwardProp: (prop) => prop !== "variant" && prop !== "isMuted",
})<VariantProps & { isMuted: boolean }>(({ theme, variant, isMuted }) => ({
  minWidth: 0,
  overflow: "hidden",
  color: isMuted ? "var(--jsb-muted)" : "var(--jsb-ink)",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  ...(variant === "box"
    ? { marginLeft: "auto" }
    : {
        ...theme.typography.monoSmall,
        fontWeight: theme.typography.fontWeightMedium,
        lineHeight: 1.4,
      }),
}));

// The body of a section lays out what it folds in a column, and the one of a box lines up under the label, after the chevron
const Content = styled("div", {
  shouldForwardProp: isNotVariant,
})<VariantProps>(({ variant }) =>
  variant === "box"
    ? { minWidth: 0, padding: "0 10px 8px 28px" }
    : {
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr)",
        rowGap: 8,
        minWidth: 0,
        padding: "4px 0",
      }
);

/**
 * A header over a body that it folds. The header is one button with a chevron, a label and an optional summary: it takes `aria-expanded` and, while the body is shown, `aria-controls`, which points at the body, so that it never names an element that is not there; the chevron turns a quarter while the body is shown. The body is not rendered while the disclosure is folded. The owner keeps the state, so that it can survive the disclosure.
 * @param props Disclosure props.
 * @param props.label Name of what is folded.
 * @param props.summary Text after the label, such as a path or a digest.
 * @param props.isSummaryMuted Whether the summary is muted instead of ink.
 * @param props.variant `section` (the default) or `box`.
 * @param props.isOpen Whether the body is shown.
 * @param props.onToggle Called when the header is pressed.
 * @param props.children What is folded.
 * @param props.testId The test id of the root element, in place of the default one.
 * @returns The disclosure.
 */
export function Disclosure({
  label,
  summary,
  isSummaryMuted = false,
  variant = "section",
  isOpen,
  onToggle,
  children,
  testId = DISCLOSURE_TEST_ID,
}: Readonly<DisclosureProps>): ReactNode {
  const bodyId = useId();

  return (
    <Root variant={variant} data-testid={testId}>
      <Header
        type="button"
        variant={variant}
        aria-expanded={isOpen}
        aria-controls={isOpen ? bodyId : undefined}
        onClick={onToggle}
      >
        <Chevron isOpen={isOpen}>
          <Icon name="chevron-right" size={12} />
        </Chevron>
        <Label variant={variant}>{label}</Label>
        {summary === undefined ? null : (
          <Summary variant={variant} isMuted={isSummaryMuted} title={summary}>
            {summary}
          </Summary>
        )}
      </Header>
      {isOpen ? (
        <Content id={bodyId} variant={variant}>
          {children}
        </Content>
      ) : null}
    </Root>
  );
}
