import Head from "@docusaurus/Head";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Heading from "@theme/Heading";
import Layout from "@theme/Layout";
import clsx from "clsx";
import type { ReactNode } from "react";

import HomepageFeatures from "@site/src/components/HomepageFeatures";
import HomepageQuote from "@site/src/components/HomePageQuote";
import HomeSponsors from "@site/src/components/HomeSponsors";
import HomeStats from "@site/src/components/HomeStats";

import styles from "./index.module.css";

const Logo = require("@site/static/img/logo.svg").default;

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <Logo width={120} height={120} />
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className={clsx(
              "button button--secondary button--lg",
              styles.heroBannerButton
            )}
            to="/docs/overview/"
          >
            Quick Start
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} | Build Quality Software`}
      description={`${siteConfig.tagline}`}
    >
      <Head>
        <meta
          name="description"
          content="Eslint Plugin Boundaries is a powerful tool to help you enforce architectural boundaries in your JavaScript and TypeScript projects."
        />
        <meta
          name="keywords"
          content="ESLint, Plugin, Boundaries, JavaScript, TypeScript, architectural boundaries, code quality, linting, static analysis, dependency management, imports rules, dependencies, external modules, layers, zones"
        />
      </Head>
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <HomepageQuote />
        <HomeStats />
        <HomeSponsors />
      </main>
    </Layout>
  );
}
