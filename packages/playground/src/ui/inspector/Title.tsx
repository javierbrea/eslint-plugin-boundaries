import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

const Heading = styled("div")(({ theme }) => ({
  ...theme.typography.mono,
  fontWeight: theme.typography.fontWeightMedium,
  lineHeight: 1.4,
  overflowWrap: "anywhere",
}));

/** Props of {@link Title}. */
type TitleProps = {
  /** The path of the file, or the name of what the inspector describes. */
  children: string;
};

/**
 * The title of what the inspector describes, in mono and wrapped anywhere: a path is never cut.
 * @param props Title props.
 * @param props.children The path or the name.
 * @returns The title.
 */
export function Title({ children }: Readonly<TitleProps>): ReactNode {
  return <Heading>{children}</Heading>;
}
