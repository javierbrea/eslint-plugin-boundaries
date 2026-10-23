import clsx from "clsx";
import type { ReactNode } from "react";

import {
  FIRST_RELEASE_YEAR,
  GITHUB_REPO,
  NPM_PACKAGE,
} from "../../../data/site/product";
import { useCurrentYear } from "../../../data/site/useCurrentYear";
import {
  DEPENDENT_REPOS,
  GITHUB_STARS_FALLBACK,
  NPM_MONTHLY_DOWNLOADS_FALLBACK,
} from "../../../data/stats/fallbacks";
import {
  fetchGithubStars,
  fetchNpmMonthlyDownloads,
} from "../../../data/stats/fetchStats";
import { formatCompact, formatThousands } from "../../../data/stats/formatStat";
import { useLiveStat } from "../../../data/stats/useLiveStat";
import Reveal from "../../motion/Reveal";

import styles from "./Numbers.module.css";

const STAGGER = 0.08;

/**
 * Adoption numbers: live npm downloads and GitHub stars, and the years of releases.
 * @returns The section.
 */
export default function Numbers(): ReactNode {
  const downloads = useLiveStat(
    () => fetchNpmMonthlyDownloads(NPM_PACKAGE),
    NPM_MONTHLY_DOWNLOADS_FALLBACK
  );
  const stars = useLiveStat(
    () => fetchGithubStars(GITHUB_REPO),
    GITHUB_STARS_FALLBACK
  );
  const years = useCurrentYear() - FIRST_RELEASE_YEAR;

  const numbers = [
    {
      value: formatCompact(downloads.value),
      label: "monthly downloads on npm",
    },
    {
      value: formatThousands(stars.value),
      label: `GitHub stars, ${DEPENDENT_REPOS} dependent repositories`,
    },
    {
      value: `${years} years`,
      label: `of releases since ${FIRST_RELEASE_YEAR}, MIT licensed`,
    },
  ];

  return (
    <section className={styles.numbers}>
      <div className={clsx("jsb-wrap", styles.grid)}>
        {numbers.map((number, index) => (
          <Reveal
            key={number.label}
            className={styles.number}
            delay={index * STAGGER}
          >
            <strong className={styles.value}>{number.value}</strong>
            <span className={styles.label}>{number.label}</span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
