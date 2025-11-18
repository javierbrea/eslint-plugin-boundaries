import Heading from "@theme/Heading";
import clsx from "clsx";
import React from "react";
import type { ReactNode } from "react";

import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<"svg">>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: "Define Your Elements",
    Svg: require("@site/static/img/undraw_software-engineer_xv60.svg").default,
    description: (
      <>
        Define your own element types using file patterns. Components, services,
        layers, domains, or whatever fits your architecture.
      </>
    ),
  },
  {
    title: "Set Boundaries",
    Svg: require("@site/static/img/undraw_adjust-settings_6pis.svg").default,
    description: (
      <>
        Define rules for dependencies between elements. Prevent unwanted
        coupling and enforce your architectural patterns automatically.
      </>
    ),
  },
  {
    title: "Get Instant Feedback",
    Svg: require("@site/static/img/undraw_in-the-zone_07y7.svg").default,
    description: (
      <>
        Distributed as an ESLint plugin. See architectural issues in your IDE
        and CI/CD pipelines. More tools coming soon.
      </>
    ),
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
