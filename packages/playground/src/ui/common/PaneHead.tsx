import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

/** Height of the head of a pane in pixels, border included. */
const HEAD_HEIGHT = 34;

const Head = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: 10,
  boxSizing: "border-box",
  height: HEAD_HEIGHT,
  padding: "0 8px 0 14px",
  borderBottom: "1px solid var(--jsb-line)",
  color: "var(--jsb-muted)",
  ...theme.typography.paneLabel,
}));

const Label = styled("span")({ flex: "none", whiteSpace: "nowrap" });

// Plain mono text in the head: the weight and the line height are the head's, and the letters are not spaced out nor uppercase
const Path = styled("span")(({ theme }) => ({
  minWidth: 0,
  overflow: "hidden",
  color: "var(--jsb-ink)",
  ...theme.typography.monoSmall,
  fontWeight: "inherit",
  lineHeight: "inherit",
  letterSpacing: 0,
  textOverflow: "ellipsis",
  textTransform: "none",
  whiteSpace: "nowrap",
}));

const Spacer = styled("span")({ flex: 1 });

// Plain text in the head: the letters are not spaced out nor uppercase, and the line height is the head's
const Hint = styled("span")(({ theme }) => ({
  minWidth: 0,
  overflow: "hidden",
  color: "var(--jsb-faint)",
  ...theme.typography.caption,
  lineHeight: "inherit",
  letterSpacing: 0,
  textOverflow: "ellipsis",
  textTransform: "none",
  whiteSpace: "nowrap",
}));

const End = styled("div")({
  display: "flex",
  flex: "1 1 auto",
  alignItems: "center",
  gap: 4,
  minWidth: 0,
  marginLeft: 8,
  // The tabs fill the head down to its line, which takes 1 px of the 34
  "& .MuiTabs-root": { alignSelf: "stretch" },
  "& .MuiTabs-root, & .MuiTab-root": { minHeight: HEAD_HEIGHT - 1 },
});

/** Props of {@link PaneHead}. */
type PaneHeadProps = {
  /** Name of the pane, drawn as a small uppercase label. */
  label: string;
  /** Path of what the pane shows, in mono and cut with an ellipsis when it does not fit. */
  path?: string;
  /** Short help for the pane, at the end of the head. */
  hint?: ReactNode;
  /** Buttons or tabs. The slot takes the free width of the head, so give the last item `marginLeft: "auto"` to push it to the end. */
  end?: ReactNode;
};

/**
 * Head of a pane: 34 px with its label, the path of what it shows, a hint and a slot for buttons or tabs.
 * @param props PaneHead props.
 * @param props.label Name of the pane.
 * @param props.path Path of what the pane shows. The full path is its `title`.
 * @param props.hint Short help for the pane.
 * @param props.end Buttons or tabs.
 * @returns The head.
 */
export function PaneHead({
  label,
  path,
  hint,
  end,
}: Readonly<PaneHeadProps>): ReactNode {
  return (
    <Head>
      <Label>{label}</Label>
      {path === undefined ? null : <Path title={path}>{path}</Path>}
      {end === undefined ? <Spacer /> : <End>{end}</End>}
      {hint === undefined ? null : <Hint>{hint}</Hint>}
    </Head>
  );
}
