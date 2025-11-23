import React from "react";
import GitHubButton from "react-github-btn";

import styles from "./styles.module.css";

export default function GithubStarsButton() {
  return (
    <div className={styles.githubButtonContainer}>
      <GitHubButton
        href="https://github.com/javierbrea/eslint-plugin-boundaries"
        data-icon="octicon-star"
        data-show-count="true"
        aria-label="Star javierbrea/eslint-plugin-boundaries on GitHub"
      >
        Star
      </GitHubButton>
    </div>
  );
}
