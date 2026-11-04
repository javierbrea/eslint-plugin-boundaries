import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

/** Height of the head of a pane in pixels, border included. */
const HEAD_HEIGHT = 34;

const Head = styled("div")({
  display: "flex",
  alignItems: "center",
  gap: 10,
  boxSizing: "border-box",
  height: HEAD_HEIGHT,
  padding: "0 8px 0 14px",
  borderBottom: "1px solid var(--jsb-line)",
  color: "var(--jsb-muted)",
  fontFamily: "var(--jsb-font-mono)",
  fontSize: 10.5,
  fontWeight: 500,
  letterSpacing: "0.14em",
  lineHeight: 1,
  textTransform: "uppercase",
});

const Label = styled("span")({ flex: "none", whiteSpace: "nowrap" });

const Path = styled("span")({
  minWidth: 0,
  overflow: "hidden",
  color: "var(--jsb-ink)",
  fontSize: 12,
  letterSpacing: 0,
  textOverflow: "ellipsis",
  textTransform: "none",
  whiteSpace: "nowrap",
});

const Spacer = styled("span")({ flex: 1 });

const Hint = styled("span")({
  minWidth: 0,
  overflow: "hidden",
  color: "var(--jsb-faint)",
  fontFamily: "var(--jsb-font-body)",
  fontSize: 12,
  letterSpacing: 0,
  textOverflow: "ellipsis",
  textTransform: "none",
  whiteSpace: "nowrap",
});

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
