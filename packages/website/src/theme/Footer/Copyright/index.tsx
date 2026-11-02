import type { Props } from "@theme/Footer/Copyright";
import type { ReactNode } from "react";

import Copyright from "../../../components/site/Copyright/Copyright";

/**
 * Renders the site copyright with the years computed on the client. `footer.copyright` in the config holds the legal notice shown below it, as plain text; Docusaurus only renders this component when that setting is not empty.
 * @param props Footer copyright props.
 * @param props.copyright Legal notice set in `footer.copyright`.
 * @returns The copyright block.
 */
export default function FooterCopyright({ copyright }: Props): ReactNode {
  return <Copyright disclaimer={copyright} />;
}
