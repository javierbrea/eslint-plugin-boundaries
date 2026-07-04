import Heading from "@theme/Heading";
import type { ReactNode } from "react";

import styles from "./styles.module.css";

function ClassificationDiagram() {
  return (
    <svg
      viewBox="0 0 480 240"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.diagram}
      aria-hidden="true"
    >
      <defs>
        <marker
          id="mlClassArrow"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" className={styles.arrowHead} />
        </marker>
      </defs>

      {/* File icon */}
      <path
        d="M20,80 L65,80 L80,95 L80,160 L20,160 Z"
        className={styles.fileBody}
      />
      <path d="M65,80 L65,95 L80,95 Z" className={styles.fileFold} />
      <line x1="32" y1="118" x2="68" y2="118" className={styles.fileLine} />
      <line x1="32" y1="130" x2="68" y2="130" className={styles.fileLine} />
      <line x1="32" y1="142" x2="52" y2="142" className={styles.fileLine} />
      <text x="50" y="177" textAnchor="middle" className={styles.fileLabel}>
        your-file.ts
      </text>

      {/* Arrows */}
      <line
        x1="82"
        y1="100"
        x2="155"
        y2="45"
        className={styles.arrowLine}
        markerEnd="url(#mlClassArrow)"
      />
      <line
        x1="82"
        y1="120"
        x2="155"
        y2="120"
        className={styles.arrowLine}
        markerEnd="url(#mlClassArrow)"
      />
      <line
        x1="82"
        y1="140"
        x2="155"
        y2="195"
        className={styles.arrowLine}
        markerEnd="url(#mlClassArrow)"
      />

      {/* Element box */}
      <rect
        x="157"
        y="15"
        width="305"
        height="60"
        rx="8"
        className={styles.layerBox}
      />
      <text x="309" y="41" textAnchor="middle" className={styles.layerName}>
        Element
      </text>
      <text x="309" y="62" textAnchor="middle" className={styles.layerExamples}>
        component · service · module
      </text>

      {/* File box */}
      <rect
        x="157"
        y="90"
        width="305"
        height="60"
        rx="8"
        className={styles.layerBox}
      />
      <text x="309" y="116" textAnchor="middle" className={styles.layerName}>
        File
      </text>
      <text
        x="309"
        y="137"
        textAnchor="middle"
        className={styles.layerExamples}
      >
        test · index · implementation
      </text>

      {/* Module box */}
      <rect
        x="157"
        y="165"
        width="305"
        height="60"
        rx="8"
        className={styles.layerBox}
      />
      <text x="309" y="191" textAnchor="middle" className={styles.layerName}>
        Module
      </text>
      <text
        x="309"
        y="212"
        textAnchor="middle"
        className={styles.layerExamples}
      >
        external · local
      </text>
    </svg>
  );
}

export default function HomepageMultiLayer(): ReactNode {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.content}>
          <Heading as="h2" className={styles.title}>
            One File, Multiple Perspectives{" "}
            <span className="badge badge--primary">Coming soon in v7</span>
          </Heading>
          <p className={styles.intro}>
            Every file in your project can be described across three independent
            dimensions simultaneously — its architectural element, its own file
            category, and the origin of its dependencies. Define rules for any
            combination.
          </p>
          <ul className={styles.layerList}>
            <li>
              <strong>Elements</strong> — the architectural unit a file belongs
              to: component, service, module...
            </li>
            <li>
              <strong>Files</strong> — the file&apos;s own categories: test,
              index, implementation...
            </li>
            <li>
              <strong>Module</strong> — where a dependency resolves: external
              library, local path, core module...
            </li>
          </ul>
          <div className={styles.diagramWrapper}>
            <ClassificationDiagram />
          </div>
        </div>
      </div>
    </section>
  );
}
