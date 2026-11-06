import { normalizeConfig } from "@boundaries/config";

import type { Sketch } from "@/contract";
import { getFiles } from "@/domains/project/helpers/sketch";

import { evaluateDependencies } from "./dependencies";
import { getAdditionalNodesProblems } from "./dependencyNodes";
import { describeFiles } from "./describeFiles";
import { areRulesValid, toConfigProblems } from "./diagnostics";
import type { Engine, Evaluation } from "./engine.types";
import type { ConfigAnalysis } from "./evaluate.types";
import { selectRule } from "./evaluatedRule";
import { normalizeConfigSafely } from "./normalizeConfigSafely";
import { parseConfig } from "./parseConfig";
import { summarizePolicies } from "./policies";
import { resolveRootPath } from "./rootPath";
import {
  summarizeElementTypes,
  summarizeFileCategories,
  summarizeRules,
} from "./summaries";

/**
 * Reads and normalizes a config text.
 * @param text The config text.
 * @returns The analysis of the text.
 */
function analyzeConfig(text: string): ConfigAnalysis {
  const parsed = parseConfig(text);
  if (!parsed.parsed) {
    // The placeholder config has diagnostics of its own, such as the missing settings, that would only hide the syntax error
    return {
      text,
      parsed,
      normalized: normalizeConfig({ settings: {}, rules: {} }),
      problems: parsed.problems,
      rulesValid: true,
      selection: { ruleName: undefined, notEvaluated: "config-unparsed" },
    };
  }
  // A policy half typed in the editor makes `normalizeConfig` throw, which would break the panes. The playground is the host that resolves the root path, as the plugin does for ESLint
  const normalized = normalizeConfigSafely(
    {
      settings: parsed.value.settings,
      rules: parsed.value.rules,
    },
    { rootPath: resolveRootPath(parsed.value.settings) }
  );
  const rulesValid = areRulesValid(normalized.diagnostics);
  return {
    text,
    parsed,
    normalized,
    problems: [
      ...parsed.problems,
      ...toConfigProblems(normalized.diagnostics, parsed.ast),
      ...getAdditionalNodesProblems(parsed, normalized.value.settings),
    ],
    rulesValid,
    selection: selectRule({
      config: parsed,
      rules: normalized.value.rules,
      rulesValid,
    }),
  };
}

/**
 * Evaluates a sketch from scratch.
 * @param sketch The sketch to evaluate.
 * @param analysis The analysis of the config text of the sketch.
 * @returns What the engine says about it.
 */
function evaluateSketch(sketch: Sketch, analysis: ConfigAnalysis): Evaluation {
  const { parsed, normalized, problems, rulesValid, selection } = analysis;
  const { settings } = normalized.value;

  // Sketch paths are relative to its root, and so is the root path of the settings. Every file is local, so there are no sources to describe. The files are the ones that the sketch says, so a node with nodes under it is a folder here as it is in the tree
  const paths = getFiles(sketch);
  const described = describeFiles(settings, paths);
  const { files } = described;

  const dependencies = evaluateDependencies({
    sketch,
    paths,
    settings,
    rule: selection.rule,
  });
  const verdicts = {
    dependencies,
    notEvaluated: selection.notEvaluated,
    policies: selection.rule
      ? summarizePolicies(selection.rule, dependencies)
      : [],
  };

  if (!parsed.parsed) {
    return {
      sketch,
      configParsed: false,
      problems,
      rulesValid,
      files,
      elementTypes: [],
      fileCategories: [],
      rules: [],
      ...verdicts,
    };
  }

  const input = {
    config: parsed,
    settings,
    diagnostics: normalized.diagnostics,
    described,
    evaluatedRuleName: selection.ruleName,
  };

  return {
    sketch,
    configParsed: true,
    problems,
    rulesValid,
    files,
    elementTypes: summarizeElementTypes(input),
    fileCategories: summarizeFileCategories(input),
    rules: summarizeRules(input),
    ...verdicts,
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
  let lastAnalysis: ConfigAnalysis | undefined;

  return {
    evaluate(sketch) {
      const known = evaluations.get(sketch);
      if (known) {
        return known;
      }
      const analysis =
        lastAnalysis?.text === sketch.config
          ? lastAnalysis
          : analyzeConfig(sketch.config);
      lastAnalysis = analysis;
      const evaluation = evaluateSketch(sketch, analysis);
      evaluations.set(sketch, evaluation);
      return evaluation;
    },
  };
}
