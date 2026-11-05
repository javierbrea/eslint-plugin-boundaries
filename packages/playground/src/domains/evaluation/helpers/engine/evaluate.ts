import { normalizeConfig } from "@boundaries/config";

import type { Sketch } from "@/contract";
import { getFiles } from "@/domains/project/helpers/sketch";

import { describeFiles } from "./describeFiles";
import { areRulesValid, toConfigProblems } from "./diagnostics";
import type { Engine, Evaluation } from "./engine.types";
import type { ConfigAnalysis } from "./evaluate.types";
import { normalizeConfigSafely } from "./normalizeConfigSafely";
import { parseConfig } from "./parseConfig";
import { resolveRootPath } from "./rootPath";
import {
  summarizeElementTypes,
  summarizeFileCategories,
  summarizeRules,
} from "./summaries";
import { diagnoseFailures } from "./writtenConfig";

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
  return {
    text,
    parsed,
    normalized,
    problems: [
      ...parsed.problems,
      ...toConfigProblems(normalized.diagnostics, parsed.ast),
    ],
  };
}

/**
 * Evaluates a sketch from scratch.
 * @param sketch The sketch to evaluate.
 * @param analysis The analysis of the config text of the sketch.
 * @returns What the engine says about it.
 */
function evaluateSketch(sketch: Sketch, analysis: ConfigAnalysis): Evaluation {
  const { parsed, normalized, problems } = analysis;
  const { settings } = normalized.value;

  // Sketch paths are relative to its root, and so is the root path of the settings. Every file is local, so there are no sources to describe. The files are the ones that the sketch says, so a node with nodes under it is a folder here as it is in the tree
  const described = describeFiles(settings, getFiles(sketch));
  const { files, failures } = described;

  if (!parsed.parsed) {
    return {
      sketch,
      configParsed: false,
      problems,
      rulesValid: true,
      files,
      elementTypes: [],
      fileCategories: [],
      rules: [],
    };
  }

  const input = {
    config: parsed,
    settings,
    diagnostics: normalized.diagnostics,
    described,
  };

  return {
    sketch,
    configParsed: true,
    // Without descriptors that fail, the problems are the same array while the text of the config does not change
    problems:
      failures.length === 0
        ? problems
        : [
            ...problems,
            ...toConfigProblems(
              diagnoseFailures(parsed, normalized.diagnostics, failures),
              parsed.ast
            ),
          ],
    rulesValid: areRulesValid(normalized.diagnostics),
    files,
    elementTypes: summarizeElementTypes(input),
    fileCategories: summarizeFileCategories(input),
    rules: summarizeRules(input),
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
