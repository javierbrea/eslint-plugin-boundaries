// Values shown until the live numbers load, and whenever the APIs fail.
// Refresh them from the APIs whenever this file is touched:
//   curl -s https://api.github.com/repos/javierbrea/eslint-plugin-boundaries | jq .stargazers_count
//   curl -s https://api.npmjs.org/downloads/point/last-month/eslint-plugin-boundaries | jq .downloads

/** GitHub stars of the repository (2026-10-23). */
export const GITHUB_STARS_FALLBACK = 1001;

/** npm downloads of the plugin in the last month (2026-10-23). */
export const NPM_MONTHLY_DOWNLOADS_FALLBACK = 7375853;

/** Repositories depending on the plugin, from the GitHub dependency graph. Not fetched live. */
export const DEPENDENT_REPOS = "4,000+";
