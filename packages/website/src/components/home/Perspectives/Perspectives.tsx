import clsx from "clsx";
import { useState } from "react";
import type { ReactNode } from "react";

import Reveal from "../../motion/Reveal";
import SectionHead from "../../ui/SectionHead/SectionHead";

import styles from "./Perspectives.module.css";

type Layer = "element" | "file" | "module";

const LAYERS: { id: Layer; text: string }[] = [
  {
    id: "element",
    text: "The architectural unit: component, service, module…",
  },
  { id: "file", text: "The file's own categories: test, index, style…" },
  {
    id: "module",
    text: "Where the dependency resolves: local, external, core.",
  },
];

const STAGGER = 0.06;

/**
 * Perspectives: the three classification layers, each highlighting its part of a dependency description.
 * @returns The section.
 */
export default function Perspectives(): ReactNode {
  const [active, setActive] = useState<Layer>("element");

  const line = (layer: Layer, text: string) => (
    <span className={clsx(styles.highlight, active === layer && styles.on)}>
      {text}
    </span>
  );

  return (
    <section className={styles.perspectives}>
      <div className={clsx("jsb-wrap", styles.grid)}>
        <div>
          <Reveal>
            <SectionHead
              className={styles.head}
              eyebrow="New in v7"
              title="One file, described from every angle"
              lead="Hover a layer to see the part of the runtime description it fills. Policies can read any of them, on both sides."
            />
          </Reveal>
          <div className={styles.cards}>
            {LAYERS.map((layer, index) => (
              <Reveal key={layer.id} delay={index * STAGGER}>
                <button
                  type="button"
                  className={clsx(
                    styles.card,
                    active === layer.id && styles.on
                  )}
                  aria-pressed={active === layer.id}
                  onPointerEnter={() => setActive(layer.id)}
                  onFocus={() => setActive(layer.id)}
                  onClick={() => setActive(layer.id)}
                >
                  <span className={styles.cardName}>{layer.id}</span>
                  <span className={styles.cardText}>{layer.text}</span>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal as="pre" className={styles.description}>
          <code>
            <span className={styles.comment}>
              {'// components/Price/Price.spec.tsx  →  import "react"'}
            </span>
            {"\n{\n  from: {\n    "}
            {line(
              "element",
              'element: { types: ["component"], captured: { name: "Price" } },'
            )}
            {"\n    "}
            {line("file", 'file: { categories: ["test"] },')}
            {"\n    "}
            {line("module", 'module: { origin: "local" },')}
            {"\n  },\n  to: {\n    "}
            {line("element", "element: { types: [] },")}
            {"\n    "}
            {line("file", "file: { categories: [] },")}
            {"\n    "}
            {line("module", 'module: { origin: "external", name: "react" },')}
            {'\n  },\n  dependency: { kind: "value", relationship: null },\n}'}
          </code>
        </Reveal>
      </div>
    </section>
  );
}
