import type { ReactNode } from "react";

import styles from "./styles.module.css";

export default function HomeSponsors(): ReactNode {
  return (
    <section>
      <div className="container">
        <div className={styles.sponsorSection}>
          <p className={styles.sponsorText}>
            Brought to you with ❤️ by{" "}
            <a
              href="https://github.com/javierbrea"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.authorLink}
            >
              @javierbrea
            </a>
            .
          </p>
          <p className={styles.sponsorSubtext}>
            Help keep boundaries maintained and growing
          </p>
          <iframe
            src="https://github.com/sponsors/javierbrea/button"
            title="Sponsor javierbrea"
            height="32"
            width="114"
            style={{ border: 0, borderRadius: "6px" }}
          ></iframe>
        </div>
      </div>
    </section>
  );
}
