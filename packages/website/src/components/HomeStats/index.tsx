import Heading from "@theme/Heading";
import type { ReactNode } from "react";

import styles from "./styles.module.css";

type StatItem = {
  value: string;
  label: string;
};

const stats: StatItem[] = [
  {
    value: "700+",
    label: "stargazers on GitHub",
  },
  {
    value: "~1M",
    label: "monthly downloads",
  },
  {
    value: "3,800+",
    label: "dependent repos",
  },
];

function StatCard({ value, label }: StatItem) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

export default function HomeStats(): ReactNode {
  return (
    <section className={styles.statsSection}>
      <div className="container">
        <Heading as="h3" className={styles.statsTitle}>
          Growing with the community
        </Heading>

        <div className={styles.chartPlaceholder}>
          <img
            src="/img/chart-placeholder.svg"
            alt="Growth chart"
            className={styles.chartImage}
          />
        </div>

        <div className={styles.statsGrid}>
          {stats.map((stat, idx) => (
            <StatCard key={idx} value={stat.value} label={stat.label} />
          ))}
        </div>
      </div>
    </section>
  );
}
