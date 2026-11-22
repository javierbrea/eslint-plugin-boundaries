import { analyzeConfig, evaluateProject } from "@boundaries/analysis";
import type {
  ConfigPath,
  DependencyVerdict as ProjectDependencyVerdict,
  PolicyRef as ProjectPolicyRef,
  ProjectConfig,
  ProjectDependency,
} from "@boundaries/analysis";

import type { Sketch, SketchDependency } from "@/contract";
import {
  getDependencySource,
  getFiles,
} from "@/domains/project/helpers/sketch";

import { getAdditionalNodesProblems } from "./dependencyNodes";
import { toConfigProblems } from "./diagnostics";
import type {
  DependencyResult,
  DependencyVerdict,
  Engine,
  Evaluation,
  PolicyRef,
  TextRange,
} from "./engine.types";
import type { TextAnalysis } from "./evaluate.types";
import { getRangeOf } from "./locations";
import { parseConfig } from "./parseConfig";

/** The config that describes the files while the text does not parse: no settings and no rules */
const EMPTY_CONFIG: ProjectConfig = { settings: {}, rules: {} };

/**
 * Reads a config text and analyzes the config it writes.
 * @param text The config text.
 * @returns The analysis of the text, with its problems and the policies of its evaluated rule placed in it.
 */
function analyzeText(text: string): TextAnalysis {
  const parsed = parseConfig(text);
  if (!parsed.parsed) {
    // The placeholder config has diagnostics of its own, such as the missing settings, that would only hide the syntax error
    return {
      text,
      parsed,
      analysis: analyzeConfig(EMPTY_CONFIG),
      problems: parsed.problems,
      policies: [],
    };
  }
  const analysis = analyzeConfig(parsed.value);
  return {
    text,
    parsed,
    analysis,
    problems: [
      ...parsed.problems,
      ...toConfigProblems(analysis.diagnostics, parsed.ast),
      ...getAdditionalNodesProblems(parsed, analysis.settings),
    ],
    policies: analysis.policies.map(({ index, path }) => ({
      index,
      range: getRangeOf(parsed.ast, path),
    })),
  };
}

/**
 * Writes a dependency of the sketch as a dependency of the project that the analysis evaluates.
 * @param dependency The dependency of the sketch.
 * @returns The same dependency, whose target is a file when it is a node, with the source its statement writes.
 */
function toProjectDependency(dependency: SketchDependency): ProjectDependency {
  const { from, target, syntax, importKind, specifiers } = dependency;
  return {
    from,
    target:
      target.kind === "node" ? { kind: "file", path: target.path } : target,
    syntax,
    importKind,
    specifiers,
    source: getDependencySource(dependency),
  };
}

/**
 * Places in the config text the policy that decided a dependency.
 * @param policy The policy, with its path in the config object.
 * @param policies The policies of the evaluated rule placed in the text, its default last.
 * @returns The placed policy at its index, or the default for the `default` option.
 */
function placePolicy(
  policy: ProjectPolicyRef,
  policies: readonly PolicyRef[]
): PolicyRef {
  return policies[policy.index ?? policies.length - 1];
}

/**
 * Places in the config text the policy of the verdict of a dependency.
 * @param verdict The verdict of the analysis.
 * @param policies The policies of the evaluated rule placed in the text, its default last.
 * @returns The same verdict, with the placed policy when a policy decided it.
 */
function placeVerdict(
  verdict: ProjectDependencyVerdict,
  policies: readonly PolicyRef[]
): DependencyVerdict {
  switch (verdict.status) {
    case "allowed":
      return { ...verdict, policy: placePolicy(verdict.policy, policies) };
    case "disallowed":
      // No policy is known when a custom message fails to render
      return {
        ...verdict,
        policy: verdict.policy && placePolicy(verdict.policy, policies),
      };
    default:
      return verdict;
  }
}

/**
 * Places a summary of the analysis in the config text.
 * @param summary The summary, with the path of what it summarizes in the config object.
 * @param range Where that is written in the text.
 * @returns The summary with the range in place of the path.
 */
function placeSummary<Summary extends { readonly path: ConfigPath }>(
  summary: Summary,
  range: TextRange
): Omit<Summary, "path"> & { readonly range: TextRange } {
  const { path: _path, ...placed } = summary;
  return { ...placed, range };
}

/**
 * Evaluates a sketch from scratch.
 * @param sketch The sketch to evaluate.
 * @param text The analysis of the config text of the sketch.
 * @returns What the engine says about it.
 */
function evaluateSketch(sketch: Sketch, text: TextAnalysis): Evaluation {
  const { parsed, analysis, problems, policies } = text;

  // Sketch paths are relative to its root, and so is the root path of the settings. The files are the ones that the sketch says, so a node with nodes under it is a folder here as it is in the tree
  const project = evaluateProject(analysis, {
    files: getFiles(sketch),
    dependencies: sketch.dependencies.map(toProjectDependency),
  });
  const dependencies = project.dependencies.map(
    (result, position): DependencyResult => ({
      dependency: sketch.dependencies[position],
      ref: result.ref,
      source: result.dependency.source,
      description: result.description,
      verdict: placeVerdict(result.verdict, policies),
    })
  );

  if (!parsed.parsed) {
    return {
      sketch,
      configParsed: false,
      problems,
      rulesValid: project.rulesValid,
      files: project.files,
      elementTypes: [],
      fileCategories: [],
      rules: [],
      dependencies,
      notEvaluated: "config-unparsed",
      policies: [],
    };
  }

  const place = <Summary extends { readonly path: ConfigPath }>(
    summary: Summary
  ) => placeSummary(summary, getRangeOf(parsed.ast, summary.path));

  return {
    sketch,
    configParsed: true,
    problems,
    rulesValid: project.rulesValid,
    files: project.files,
    elementTypes: project.elementTypes.map(place),
    fileCategories: project.fileCategories.map(place),
    rules: project.rules.map(place),
    dependencies,
    notEvaluated: project.notEvaluated,
    // The summaries are in the order of the placed policies, so each one takes the range of its policy, the same object
    policies: project.policies.map((summary, position) =>
      placeSummary(summary, policies[position].range)
    ),
  };
}

/**
 * Creates an engine. Its memory is its own: the evaluations of the sketches it has seen and the analysis of the last config text.
 * @returns An engine that evaluates sketches, which is pure and memoized.
 */
export function createEngine(): Engine {
  /** The evaluation of each sketch, which never changes, so the same object is the same evaluation */
  const evaluations = new WeakMap<Sketch, Evaluation>();

  /** The analysis of the last config text. One is enough: edits come one after another, and most of them do not touch the config */
  let lastAnalysis: TextAnalysis | undefined;

  return {
    evaluate(sketch) {
      const known = evaluations.get(sketch);
      if (known) {
        return known;
      }
      const analysis =
        lastAnalysis?.text === sketch.config
          ? lastAnalysis
          : analyzeText(sketch.config);
      lastAnalysis = analysis;
      const evaluation = evaluateSketch(sketch, analysis);
      evaluations.set(sketch, evaluation);
      return evaluation;
    },
  };
}
