import Heading from "@theme/Heading";
import clsx from "clsx";
import type { ReactNode } from "react";

import { DOCS_QUICK_START } from "../../../data/site/links";
import { MAJOR_VERSION, NPM_PACKAGE } from "../../../data/site/product";
import {
  DEPENDENT_REPOS,
  NPM_MONTHLY_DOWNLOADS_FALLBACK,
} from "../../../data/stats/fallbacks";
import { fetchNpmMonthlyDownloads } from "../../../data/stats/fetchStats";
import { formatCompact } from "../../../data/stats/formatStat";
import { useLiveStat } from "../../../data/stats/useLiveStat";
import Button from "../../ui/Button/Button";
import Eyebrow from "../../ui/Eyebrow/Eyebrow";

import BlueprintSheet from "./BlueprintSheet";
import styles from "./Hero.module.css";
import InstallCommand from "./InstallCommand";

/** Lead paragraph of the hero, also used as the page description. */
export const HERO_LEAD =
  "Classify your files, write policies for who may depend on whom, and get an ESLint error the moment a boundary is crossed. In your IDE, in CI, with nothing new to run.";

/**
 * Hero of the home page: headline, calls to action, adoption line and the blueprint drawing.
 * @returns The hero header.
 */
export default function Hero(): ReactNode {
  const downloads = useLiveStat(
    () => fetchNpmMonthlyDownloads(NPM_PACKAGE),
    NPM_MONTHLY_DOWNLOADS_FALLBACK
  );

  return (
    <header className={styles.hero}>
      <div className={clsx("jsb-wrap", styles.grid)}>
        <div className={styles.copy}>
          <Eyebrow>ESLint plugin · v{MAJOR_VERSION}</Eyebrow>
          <Heading as="h1" className={styles.title}>
            Lint your <u>architecture</u>, not just your syntax.
          </Heading>
          <p className={styles.lead}>{HERO_LEAD}</p>
          <div className={styles.cta}>
            <Button to={DOCS_QUICK_START} arrow>
              Read the quick start
            </Button>
            <InstallCommand />
          </div>
          <p className={styles.used}>
            Linting <b>{DEPENDENT_REPOS}</b> repositories ·{" "}
            <b>{formatCompact(downloads.value)}</b> downloads a month · ESLint 9
            · Oxlint · TypeScript
          </p>
        </div>
        <BlueprintSheet />
      </div>
    </header>
  );
}
