import { getPlaygroundHash } from "@boundaries/playground/share";
import { useMemo } from "react";
import type { ReactNode } from "react";

import { PLAYGROUND } from "../../data/site/links";
import Button from "../ui/Button/Button";

import styles from "./styles.module.css";

/** Props of {@link OpenInPlayground}. */
export type OpenInPlaygroundProps = {
  /** The JSON5 text of the config object `{ settings, rules }`, as the playground shows it. */
  config: string;
  /** The project in the format of the playground's text mode: one path per line, folders ending in `/`, and the dependencies of a file indented two spaces under it. */
  project: string;
};

/**
 * Button of the docs that opens an example in the playground. The link is computed while rendering, so the server render already holds it, and a project that text mode cannot read throws, which fails the build instead of publishing a link that opens another project. Docusaurus adds the base URL to the link and navigates client-side, which keeps the hash for the playground to read.
 *
 * In an MDX page, pass the texts through `export const`: MDX removes up to two spaces of indentation from every line of a template literal written inside a JSX attribute, which would leave the dependencies of the project unindented.
 * @param props Open in playground props.
 * @param props.config The JSON5 text of the config object `{ settings, rules }`, as the playground shows it.
 * @param props.project The project in the format of the playground's text mode.
 * @returns The link, styled as a button.
 */
export default function OpenInPlayground({
  config,
  project,
}: Readonly<OpenInPlaygroundProps>): ReactNode {
  const hash = useMemo(
    () => getPlaygroundHash({ config, project }),
    [config, project]
  );

  return (
    <div className={styles.root}>
      {/* The hash is not an anchor of the page, so the build must not look for it */}
      <Button
        variant="outline"
        arrow
        noBrokenLinkCheck
        className={styles.link}
        to={`${PLAYGROUND}#${hash}`}
      >
        Open in playground
      </Button>
    </div>
  );
}
