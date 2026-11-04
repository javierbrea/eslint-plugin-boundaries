import { styled } from "@mui/material/styles";
import { useMemo } from "react";
import type { ReactNode } from "react";

import type { Sketch } from "../contract";
import type { ConfigProblem } from "../engine";
import { CONFIG_PATH, addNode, getUniquePath } from "../sketch";
import type { TextProblem } from "../sketch";

import { Note } from "./common";
import { Inspector } from "./inspector";
import { Regions, TopBar } from "./layout";
import { ConfigPane, EmptyPane, FilePane } from "./node";
import {
  ProblemList,
  ProblemsPanel,
  getConfigProblemItems,
  getCountTone,
  getTabLabel,
  getTextProblemItems,
} from "./problems";
import type { ProblemLevel, ProblemTone, ProblemsTab } from "./problems";
import { ProjectPane } from "./project";
import type { ProblemCounts } from "./state/Focus.types";
import { useEvaluation } from "./state/useEvaluation";
import { useWorkbench } from "./state/useWorkbench";
import type { WorkbenchProps } from "./Workbench.types";

/** Where the desktop-only note takes over: the mobile navbar breakpoint of the website, which never renders the playground below it. */
const NARROW_QUERY = "@media (max-width: 996px)";

/** The name of the file that `+ File` adds when nothing is open, until the user renames it. */
const NEW_FILE_NAME = "new-file.js";

/** The problems that name a file or a folder: none until phase 6 evaluates dependencies. */
const NO_PATH_COUNTS: ProblemCounts["byPath"] = new Map();

/** What the panes show of the problems: how many there are and how serious they are, for the status of the bar, the tabs and the badge of the config node. */
type ProblemSummary = {
  /** Problems of the config. */
  readonly configCount: number;
  /** The color of the count of the config. */
  readonly configTone: ProblemTone;
  /** Problems of the config and lines of text mode that could not be read. */
  readonly total: number;
  /** The color of the total. */
  readonly tone: ProblemTone;
  /** Whether any problem of the config is an error. */
  readonly configHasErrors: boolean;
};

const Frame = styled("section")({
  boxSizing: "border-box",
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
});

const Layout = styled("div")({
  display: "grid",
  gridTemplateRows: "44px minmax(0, 1fr)",
  height: "100%",
  [NARROW_QUERY]: { display: "none" },
});

// The website shows this note itself and never renders the workbench below the breakpoint; it is here for a host that does
const DesktopOnly = styled("p")({
  display: "none",
  margin: "32px 16px",
  padding: "1.25rem 1.5rem",
  border: "1px dashed var(--jsb-line-strong)",
  borderRadius: "var(--jsb-radius-lg)",
  color: "var(--jsb-muted)",
  [NARROW_QUERY]: { display: "block" },
});

/**
 * Counts the problems and tells how serious they are.
 * @param problems The problems of the config.
 * @param textProblems The lines of text mode that could not be read, each one an error.
 * @returns The counts and tones that the panes show.
 */
function summarizeProblems(
  problems: readonly ConfigProblem[],
  textProblems: readonly TextProblem[]
): ProblemSummary {
  const configLevels = problems.map(({ level }) => level);
  const textLevels = textProblems.map((): ProblemLevel => "error");

  return {
    configCount: problems.length,
    configTone: getCountTone(configLevels),
    total: problems.length + textProblems.length,
    tone: getCountTone([...configLevels, ...textLevels]),
    configHasErrors: configLevels.includes("error"),
  };
}

/**
 * The workbench: the whole playground once a sketch is loaded. It holds the state, evaluates the sketch with the engine after each edit, and lays out the project, the node in focus, the inspector and the problems panel. Panes receive data and callbacks and keep no copy of the sketch.
 * @param props Workbench props.
 * @param props.initialSketch The sketch to start from.
 * @param props.capabilities What the user can change in the project.
 * @param props.onSketchChange Called with each new sketch after an edit.
 * @returns The workbench, as large as its container.
 */
export function Workbench({
  initialSketch,
  capabilities,
  onSketchChange,
}: Readonly<WorkbenchProps>): ReactNode {
  const { state, actions } = useWorkbench(initialSketch, onSketchChange);
  const evaluation = useEvaluation(state.sketch);
  const { focus: openNode, view, tab, collapsed, textProblems, reveal } = state;
  const { problems } = evaluation;

  const summary = useMemo(
    () => summarizeProblems(problems, textProblems),
    [problems, textProblems]
  );
  const counts = useMemo<ProblemCounts>(
    () => ({
      config: summary.configCount,
      configHasErrors: summary.configHasErrors,
      byPath: NO_PATH_COUNTS,
    }),
    [summary]
  );
  const configItems = useMemo(
    () => getConfigProblemItems(problems),
    [problems]
  );
  const textItems = useMemo(
    () => getTextProblemItems(textProblems),
    [textProblems]
  );

  /** Adds a file at the root with a free name and opens it: the pane of nothing open has no tree to rename it in, so the user renames it from the tree. */
  function addFile(): void {
    const path = getUniquePath(state.sketch, "", NEW_FILE_NAME);
    // The path is free and valid at the root, with no file above it, so the edit is never refused
    const { sketch } = addNode(state.sketch, path, "file") as {
      sketch: Sketch;
    };

    actions.changeSketch(sketch);
    actions.focus({ kind: "file", path });
  }

  /**
   * Opens what a row of the problem list points at. A problem of the config opens the editor at its range. A line of text mode is already in front of the user, in the text it is about, so it opens nothing.
   * @param id The id of the row, as the problem list builds it.
   */
  function openProblem(id: string): void {
    const index = /^config:(\d+)$/.exec(id)?.[1];

    if (index !== undefined) {
      actions.reveal(problems[Number(index)].range);
    }
  }

  const tabs: ProblemsTab[] = [
    {
      id: "sketch",
      label: "Sketch",
      count: summary.total,
      tone: summary.tone,
    },
  ];
  if (openNode.kind === "config") {
    tabs.push({
      id: "node",
      label: CONFIG_PATH,
      mono: true,
      count: summary.configCount,
      tone: summary.configTone,
    });
  } else if (openNode.kind === "file") {
    tabs.push({ id: "node", label: getTabLabel(openNode.path), mono: true });
  }

  const note = evaluation.rulesValid ? null : (
    <Note>
      Dependencies are not evaluated while the rule options are invalid: ESLint
      does not run a rule whose options fail its schema.
    </Note>
  );

  let problemsBody: ReactNode;
  if (tab === "sketch") {
    problemsBody = (
      <>
        {note}
        <ProblemList
          items={[...configItems, ...textItems]}
          onOpen={openProblem}
          empty="No problems in the sketch."
        />
      </>
    );
  } else if (openNode.kind === "config") {
    problemsBody = (
      <>
        {note}
        <ProblemList
          items={configItems}
          onOpen={openProblem}
          empty="No problems in the config."
        />
      </>
    );
  } else {
    problemsBody = (
      <ProblemList
        items={[]}
        onOpen={openProblem}
        empty="No problems in this file."
      />
    );
  }

  let node: ReactNode;
  if (openNode.kind === "file") {
    node = <FilePane path={openNode.path} />;
  } else if (openNode.kind === "config") {
    node = (
      <ConfigPane
        config={state.sketch.config}
        problems={problems}
        readOnly={!capabilities.editConfig}
        reveal={reveal}
        onChange={actions.changeConfig}
      />
    );
  } else {
    node = (
      <EmptyPane
        canAddFile={capabilities.editTree}
        onOpenConfig={() => actions.focus({ kind: "config" })}
        onAddFile={addFile}
      />
    );
  }

  return (
    <Frame aria-label="Playground">
      <DesktopOnly>
        The playground needs a wider screen. Open this page on a desktop browser
        to use it.
      </DesktopOnly>
      <Layout>
        <TopBar
          files={evaluation.files.size}
          problems={summary.total}
          tone={summary.tone}
          configHasErrors={summary.configHasErrors}
        />
        <Regions
          project={
            <ProjectPane
              sketch={state.sketch}
              focus={openNode}
              view={view}
              counts={counts}
              capabilities={capabilities}
              onViewChange={actions.changeView}
              onSketchChange={actions.changeSketch}
              onFocus={actions.focus}
              onTextProblems={actions.setTextProblems}
            />
          }
          node={node}
          inspector={
            <Inspector
              focus={openNode}
              evaluation={evaluation}
              onReveal={actions.reveal}
            />
          }
          problems={
            <ProblemsPanel
              tabs={tabs}
              selected={tab}
              onSelect={(id) =>
                actions.selectTab(id === "node" ? "node" : "sketch")
              }
              collapsed={collapsed}
              onCollapsedChange={actions.setCollapsed}
            >
              {problemsBody}
            </ProblemsPanel>
          }
          isTextMode={view === "text"}
          isProblemsCollapsed={collapsed}
          onProblemsCollapsedChange={actions.setCollapsed}
        />
      </Layout>
    </Frame>
  );
}
