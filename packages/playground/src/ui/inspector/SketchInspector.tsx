import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import type { Evaluation } from "@/domains/evaluation/helpers/engine";
import { SectionTitle } from "@/ui-kit/atoms/SectionTitle";

const Numbers = styled("div")({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  border: "1px solid var(--jsb-line)",
  borderRadius: "var(--jsb-radius)",
});

const Tile = styled("div")({
  display: "grid",
  gap: 2,
  padding: "10px 12px",
  "&:nth-of-type(odd)": { borderRight: "1px solid var(--jsb-line)" },
  "&:nth-of-type(n + 3)": { borderTop: "1px solid var(--jsb-line)" },
});

const Count = styled("b")(({ theme }) => theme.typography.figure);

const Label = styled("span")(({ theme }) => ({
  ...theme.typography.caption,
  color: "var(--jsb-muted)",
}));

/** Props of {@link SketchInspector}. */
type SketchInspectorProps = {
  /** What the engine says about the sketch. */
  evaluation: Evaluation;
};

/**
 * What the inspector shows when nothing is open: the numbers of the sketch. Phase 6 adds the dependencies and the disallowed ones, which makes the grid 2×3.
 * @param props SketchInspector props.
 * @param props.evaluation What the engine says about the sketch.
 * @returns The content of the inspector.
 */
export function SketchInspector({
  evaluation,
}: Readonly<SketchInspectorProps>): ReactNode {
  const { files, elementTypes, fileCategories, rules } = evaluation;
  const numbers = [
    { label: "files", count: files.size },
    { label: "element types", count: elementTypes.length },
    { label: "file categories", count: fileCategories.length },
    {
      label: "policies",
      count: rules.reduce((total, { policies }) => total + policies, 0),
    },
  ];

  return (
    <>
      <SectionTitle>Sketch</SectionTitle>
      <Numbers>
        {numbers.map(({ label, count }) => (
          <Tile key={label}>
            <Count>{count}</Count>
            <Label>{label}</Label>
          </Tile>
        ))}
      </Numbers>
    </>
  );
}
