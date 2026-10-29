import clsx from "clsx";
import type { ReactNode } from "react";

import { GITHUB_REPO_URL } from "../../../data/site/links";
import { GITHUB_REPO } from "../../../data/site/product";
import { GITHUB_STARS_FALLBACK } from "../../../data/stats/fallbacks";
import { fetchGithubStars } from "../../../data/stats/fetchStats";
import { formatThousands } from "../../../data/stats/formatStat";
import { useLiveStat } from "../../../data/stats/useLiveStat";
import { StarIcon } from "../../ui/Icons/Icons";

import styles from "./GithubStars.module.css";

/** Props that Docusaurus passes to a custom navbar item. */
export type GithubStarsProps = {
  /** Whether the item renders in the mobile sidebar instead of the navbar. */
  mobile?: boolean;
};

/**
 * Navbar pill linking to the repository with its live number of GitHub stars.
 * @param props Navbar item props.
 * @param props.mobile Whether the item renders in the mobile sidebar instead of the navbar.
 * @returns The link, wrapped in a list item in the mobile sidebar.
 */
export default function GithubStars({
  mobile = false,
}: GithubStarsProps): ReactNode {
  const stars = useLiveStat(
    () => fetchGithubStars(GITHUB_REPO),
    GITHUB_STARS_FALLBACK
  );
  const count = formatThousands(stars.value);

  const link = (
    <a
      className={clsx(mobile ? "menu__link" : styles.stars)}
      href={GITHUB_REPO_URL}
      aria-label={`Star the repository on GitHub, ${count} stars`}
    >
      <StarIcon className={styles.icon} />
      <span className={styles.count}>{count}</span>
    </a>
  );

  // The mobile sidebar renders navbar items inside a list
  return mobile ? <li className="menu__list-item">{link}</li> : link;
}
