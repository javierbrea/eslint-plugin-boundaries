import Heading from "@theme/Heading";
import type { Props } from "@theme/NotFound/Content";
import clsx from "clsx";
import type { ReactNode } from "react";

import Button from "../../../components/ui/Button/Button";
import Eyebrow from "../../../components/ui/Eyebrow/Eyebrow";

import styles from "./styles.module.css";

/**
 * Content of the 404 page: eyebrow, title, lead and a link to the docs index.
 * @param props Not found content props.
 * @returns The page content.
 */
export default function NotFoundContent({ className }: Props): ReactNode {
  return (
    <main className={clsx(styles.main, className)}>
      <div className={clsx("jsb-wrap", styles.inner)}>
        <Eyebrow>404</Eyebrow>
        <Heading as="h1" className={styles.title}>
          Nothing is drawn here
        </Heading>
        <p className={styles.lead}>
          The page you asked for does not exist or moved. The docs index is the
          best place to start.
        </p>
        <Button to="/docs/overview/" arrow>
          Go to the docs
        </Button>
      </div>
    </main>
  );
}
