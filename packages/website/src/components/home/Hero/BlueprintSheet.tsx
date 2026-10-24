import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";

import { useMediaQuery } from "../../motion/useMediaQuery";
import { useReducedMotion } from "../../motion/useReducedMotion";

import styles from "./BlueprintSheet.module.css";

type Slab = {
  id: string;
  type: string;
  pattern: string;
};

const SLABS: Slab[] = [
  { id: "modules", type: "module", pattern: "modules/*" },
  { id: "components", type: "component", pattern: "components/*/*" },
  { id: "helpers", type: "helper", pattern: "helpers/*" },
];

// Vertical position of the left corner of the top slab, and the distance between slabs
const SLAB_TOP = 110;
const SLAB_GAP = 130;

// Draw-in layer of each slab, staggered by the CSS
const SLAB_LAYERS = [styles.l1, styles.l2, styles.l3];

const DEFAULT_SLAB = SLABS[1];

// Degrees of rotation when the pointer is at the edges of the sheet
const MAX_TILT_X = 12;
const MAX_TILT_Y = 14;

function describe(slab: Slab): string {
  return `{ type: "${slab.type}", pattern: "${slab.pattern}" }`;
}

/**
 * Isometric blueprint of three architecture layers that draws itself on load, tilts with the pointer and describes the hovered or focused layer.
 * @returns The drawing with its caption.
 */
export default function BlueprintSheet(): ReactNode {
  const [active, setActive] = useState<Slab | null>(null);
  const reducedMotion = useReducedMotion();
  const noHover = useMediaQuery("(hover: none)");
  const canTilt = !reducedMotion && !noHover;
  const svgRef = useRef<SVGSVGElement>(null);
  const frame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const tilt = (pointerEvent: ReactPointerEvent<HTMLDivElement>) => {
    const rect = pointerEvent.currentTarget.getBoundingClientRect();
    // Pointer position relative to the center of the sheet, in [-1, 1]
    const x = ((pointerEvent.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((pointerEvent.clientY - rect.top) / rect.height) * 2 - 1;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      if (svgRef.current) {
        // The attribute switches the CSS to the short "follow the pointer" transition
        svgRef.current.dataset.tilting = "";
        svgRef.current.style.transform = `rotateX(${-y * MAX_TILT_X}deg) rotateY(${x * MAX_TILT_Y}deg)`;
      }
    });
  };

  const resetTilt = () => {
    cancelAnimationFrame(frame.current);
    if (svgRef.current) {
      // Removing the attribute in the same frame as the reset makes the return use the long transition
      delete svgRef.current.dataset.tilting;
      svgRef.current.style.transform = "";
    }
  };

  const captionSlab = active ?? DEFAULT_SLAB;

  return (
    <div
      className={styles.sheet}
      onPointerMove={canTilt ? tilt : undefined}
      onPointerLeave={canTilt ? resetTilt : undefined}
    >
      <svg
        ref={svgRef}
        className={styles.drawing}
        viewBox="0 0 520 500"
        role="group"
        aria-label="Blueprint drawing of three architecture layers: modules depend on components, components on helpers; a helper importing a component is marked as disallowed"
      >
        <defs>
          <marker
            id="jsb-arrow-ok"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
          >
            <path className={styles.arrowOk} d="M0,0 L8,4 L0,8 z" />
          </marker>
          <marker
            id="jsb-arrow-bad"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
          >
            <path className={styles.arrowBad} d="M0,0 L8,4 L0,8 z" />
          </marker>
        </defs>

        <path
          className={styles.corners}
          d="M14 30V14h16M506 14h-16M506 30V14M14 470v16h16M506 486h-16M506 470v16"
        />

        <g className={clsx(styles.draw, styles.l5)}>
          <line
            className={styles.dim}
            x1="470"
            y1="70"
            x2="470"
            y2="430"
            pathLength="1"
          />
          <line
            className={styles.dim}
            x1="464"
            y1="70"
            x2="476"
            y2="70"
            pathLength="1"
          />
          <line
            className={styles.dim}
            x1="464"
            y1="430"
            x2="476"
            y2="430"
            pathLength="1"
          />
          <text
            className={styles.dimText}
            x="478"
            y="254"
            transform="rotate(90 478 254)"
            textAnchor="middle"
          >
            3 element types · 1 rule
          </text>
        </g>

        {SLABS.map((slab, index) => {
          const y = SLAB_TOP + index * SLAB_GAP;
          const draw = clsx(styles.draw, SLAB_LAYERS[index]);
          return (
            <g
              key={slab.id}
              className={clsx(styles.slab, active === slab && styles.on)}
              tabIndex={0}
              role="button"
              aria-label={`${slab.id} layer: ${describe(slab)}`}
              onPointerEnter={() => setActive(slab)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(slab)}
              onBlur={() => setActive(null)}
              onKeyDown={(keyEvent) => {
                // A role="button" answers Enter and Space; Space would otherwise scroll the page
                if (keyEvent.key === "Enter" || keyEvent.key === " ") {
                  keyEvent.preventDefault();
                  setActive(slab);
                }
              }}
            >
              <path
                className={draw}
                pathLength="1"
                d={`M110 ${y} L260 ${y - 50} L410 ${y} L260 ${y + 50} Z`}
              />
              <path
                className={clsx(draw, styles.face)}
                pathLength="1"
                d={`M110 ${y} L110 ${y + 18} L260 ${y + 68} L260 ${y + 50} Z`}
              />
              <path
                className={draw}
                pathLength="1"
                d={`M260 ${y + 50} L260 ${y + 68} L410 ${y + 18} L410 ${y} Z`}
              />
              <text x="260" y={y + 4} textAnchor="middle">
                {slab.pattern}
              </text>
            </g>
          );
        })}

        <path
          className={clsx(styles.edgeOk, styles.draw, styles.l4)}
          pathLength="1"
          d="M200 160 C190 185 190 195 200 212"
          markerEnd="url(#jsb-arrow-ok)"
        />
        <path
          className={clsx(styles.edgeOk, styles.draw, styles.l4)}
          pathLength="1"
          d="M330 160 C340 185 340 195 330 212"
          markerEnd="url(#jsb-arrow-ok)"
        />
        <path
          className={clsx(styles.edgeOk, styles.draw, styles.l4)}
          pathLength="1"
          d="M200 290 C190 315 190 325 200 342"
          markerEnd="url(#jsb-arrow-ok)"
        />
        <g className={clsx(styles.tag, styles.tagOk)}>
          <text x="150" y="190">
            allow →
          </text>
          <text x="150" y="320">
            allow →
          </text>
        </g>

        <path
          className={styles.edgeBad}
          d="M420 380 C470 330 470 290 420 258"
          markerEnd="url(#jsb-arrow-bad)"
        />
        <g className={clsx(styles.tag, styles.tagBad)}>
          <rect x="330" y="300" width="128" height="20" rx="3" />
          <text x="394" y="314" textAnchor="middle">
            ✕ helper → component
          </text>
        </g>
      </svg>
      <p className={styles.caption}>
        {active ? active.id : "hover a layer"} ·{" "}
        <code>{describe(captionSlab)}</code>
      </p>
    </div>
  );
}
