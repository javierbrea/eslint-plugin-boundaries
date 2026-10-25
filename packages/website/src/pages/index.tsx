import Head from "@docusaurus/Head";
import Layout from "@theme/Layout";
import type { ReactNode } from "react";

import FinalCta from "../components/home/FinalCta/FinalCta";
import Hero, { HERO_LEAD } from "../components/home/Hero/Hero";
import Numbers from "../components/home/Numbers/Numbers";
import Perspectives from "../components/home/Perspectives/Perspectives";
import PlaygroundTeaser from "../components/home/PlaygroundTeaser/PlaygroundTeaser";
import Problem from "../components/home/Problem/Problem";
import Quote from "../components/home/Quote/Quote";
import Spec from "../components/home/Spec/Spec";
import Steps from "../components/home/Steps/Steps";

export default function Home(): ReactNode {
  return (
    <Layout
      title="Lint your architecture, not just your syntax"
      description={HERO_LEAD}
    >
      <Head>
        <meta name="description" content={HERO_LEAD} />
        <meta
          name="keywords"
          content="ESLint plugin,boundaries,javaScript,typeScript,architectural layers,software architecture,module dependencies,project structure,code quality,linting,static analysis,dependencies,architecture,clean code"
        />
      </Head>
      <Hero />
      <main>
        <Problem />
        <Steps />
        <Spec />
        <Perspectives />
        <Numbers />
        <Quote />
        <PlaygroundTeaser />
        <FinalCta />
      </main>
    </Layout>
  );
}
