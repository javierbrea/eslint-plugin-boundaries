import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import type { SectionTitleProps } from "./SectionTitle.types";

const Heading = styled("div")(({ theme }) => ({
  ...theme.typography.mono,
  fontWeight: theme.typography.fontWeightMedium,
  lineHeight: 1.4,
  overflowWrap: "anywhere",
}));

/**
 * The title of what a pane describes, in mono and wrapped anywhere: a path is never cut.
 * @param props SectionTitle props.
 * @param props.children The path or the name.
 * @returns The title.
 */
export function SectionTitle({
  children,
}: Readonly<SectionTitleProps>): ReactNode {
  return <Heading>{children}</Heading>;
}
