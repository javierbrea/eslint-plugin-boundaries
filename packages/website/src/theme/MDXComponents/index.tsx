import MDXComponents from "@theme-original/MDXComponents";
import type { ComponentProps, ReactNode } from "react";

/**
 * Markdown table. Tables scroll inside their own box when wider than the column (`custom.css`), so they are focusable, like Docusaurus' own code blocks, to be scrolled with the keyboard.
 * @param props Table props.
 * @returns The table.
 */
function Table(props: ComponentProps<"table">): ReactNode {
  return <table tabIndex={0} {...props} />;
}

export default {
  ...MDXComponents,
  table: Table,
};
