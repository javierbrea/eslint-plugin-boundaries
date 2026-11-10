import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { getSkipReasonSentence } from "@/domains/evaluation/ui/helpers/verdictText";
import { InspectorRows } from "@/domains/files/ui/atoms/InspectorRows";
import { PropertyList } from "@/domains/files/ui/atoms/PropertyList";
import { getTargetName } from "@/domains/files/ui/helpers/dependencyLabels";
import { describeDependencyEntries } from "@/domains/files/ui/helpers/descriptionEntries";
import { DependencySummary } from "@/domains/files/ui/molecules/DependencySummary";
import { EntityBoxes } from "@/domains/files/ui/molecules/EntityBoxes";
import { Disclosure } from "@/ui-kit/molecules/Disclosure";
import { Note } from "@/ui-kit/molecules/Note";

import {
  FILE_INSPECTOR_TEST_ID,
  NO_DEPENDENCY_HINT,
  NO_DEPENDENCY_TEXT,
} from "./FileInspector.constants";
import type { FileInspectorProps } from "./FileInspector.types";

// The parts are separated by a line and padded as the sketch draws its sections. The first one starts where the content of the layout does, and a long path is cut inside the pane instead of widening it. The padding above a part comes with the line above it, because Emotion warns that `:first-child` is unsafe when it renders on a server
const Root = styled("div")({
  minWidth: 0,
  "& > *": { padding: "0 0 6px" },
  "& > * + *": {
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: "var(--jsb-line)",
  },
});

// The counts line up with the label of the section, after its chevron and the gap
const Summary = styled(DependencySummary)({ padding: "0 0 2px 20px" });

const Hint = styled("p")(({ theme }) => ({
  margin: "4px 0 0 20px",
  padding: "8px 10px",
  borderWidth: 1,
  borderStyle: "dashed",
  borderColor: "var(--jsb-line-strong)",
  borderRadius: "var(--jsb-radius)",
  color: "var(--jsb-muted)",
  ...theme.typography.body2,
}));

const Remark = styled(Note)({ margin: "4px 0 0 20px" });

/**
 * What the inspector shows for a file and, when one of its dependencies is in focus, for that dependency. Three sections are named as the keys of a policy. `from` is the open file: its path, how many dependencies it has and what the engine decided about them, and the boxes `element`, `file` and `module` of how the plugin describes it. `to` is what the dependency in focus points to, with the same boxes: its header is the path of the file, or the name of the external module. `dependency` is the dependency itself, with the line of its header, in one box with the properties of a dependency selector. Every section and every box folds, and what is open is the owner's to keep, by place.
 *
 * With no dependency in focus, `to` and `dependency` read a dash and a hint says to click a line. A dependency that the plugin does not read has no description, so `to` and `dependency` read their target and their line, and a note says why the plugin does not check it; a dependency that no evaluation has decided yet reads the same, with no note. A file that the evaluation does not know, such as one that an edit just removed, has its path only.
 * @param props FileInspector props.
 * @param props.path Path of the file in focus.
 * @param props.evaluation What the engine says about the sketch.
 * @param props.dependencyIndex The position of the dependency in focus among the ones of the file.
 * @param props.openPlaces Whether each section and each box is open.
 * @param props.onToggle Called with the place whose header was pressed.
 * @returns The content of the inspector.
 */
export function FileInspector({
  path,
  evaluation,
  dependencyIndex,
  openPlaces,
  onToggle,
}: Readonly<FileInspectorProps>): ReactNode {
  const description = evaluation.files.get(path);

  if (description === undefined) {
    return (
      <Root data-testid={FILE_INSPECTOR_TEST_ID}>
        <InspectorRows rows={[{ label: "from", text: path, tone: "ink" }]} />
      </Root>
    );
  }

  const fileResults = evaluation.dependencies.filter(
    ({ ref }) => ref.path === path
  );
  const result =
    dependencyIndex === undefined
      ? undefined
      : fileResults.find(({ ref }) => ref.index === dependencyIndex);
  let dependencySections: ReactNode;

  if (result === undefined) {
    dependencySections = (
      <div>
        <InspectorRows
          rows={[
            { label: "to", text: NO_DEPENDENCY_TEXT, tone: "faint" },
            { label: "dependency", text: NO_DEPENDENCY_TEXT, tone: "faint" },
          ]}
        />
        <Hint>{NO_DEPENDENCY_HINT}</Hint>
      </div>
    );
  } else {
    const target = getTargetName(result.dependency.target);
    const line = `line ${result.ref.index + 1}`;

    if (result.description === undefined) {
      dependencySections = (
        <div>
          <InspectorRows
            rows={[
              { label: "to", text: target, tone: "ink" },
              { label: "dependency", text: line, tone: "muted" },
            ]}
          />
          {
            // A dependency that no evaluation has decided yet has no description either, and nothing is known of it
            result.verdict.status === "pending" ? null : (
              <Remark>{getSkipReasonSentence("not-read")}</Remark>
            )
          }
        </div>
      );
    } else {
      dependencySections = (
        <>
          <Disclosure
            label="to"
            summary={target}
            isOpen={openPlaces.to}
            onToggle={() => onToggle("to")}
          >
            <EntityBoxes
              description={result.description.to}
              side="to"
              openPlaces={openPlaces}
              onToggle={onToggle}
            />
          </Disclosure>
          <Disclosure
            label="dependency"
            summary={line}
            isSummaryMuted
            isOpen={openPlaces.dependency}
            onToggle={() => onToggle("dependency")}
          >
            <PropertyList
              isFramed
              entries={describeDependencyEntries(result.description.dependency)}
            />
          </Disclosure>
        </>
      );
    }
  }

  return (
    <Root data-testid={FILE_INSPECTOR_TEST_ID}>
      <Disclosure
        label="from"
        summary={path}
        isOpen={openPlaces.from}
        onToggle={() => onToggle("from")}
      >
        <Summary
          results={fileResults}
          isEvaluated={evaluation.notEvaluated === undefined}
        />
        <EntityBoxes
          description={description}
          side="from"
          openPlaces={openPlaces}
          onToggle={onToggle}
        />
      </Disclosure>
      {dependencySections}
    </Root>
  );
}
