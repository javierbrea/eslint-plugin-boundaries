import { normalizeConfig } from "@boundaries/config";
import { describeEntity } from "@boundaries/policies";

import type { Sketch } from "../contract";

import { areRulesValid, toConfigProblems } from "./Diagnostics";
import type { Evaluation } from "./Engine.types";
import type { ConfigAnalysis } from "./Evaluate.types";
import { getRangeOf } from "./Locations";
import { normalizeConfigSafely } from "./NormalizeConfigSafely";
import { parseConfig } from "./ParseConfig";
import {
  summarizeElementTypes,
  summarizeFileCategories,
  summarizeRules,
} from "./Summaries";

/** The evaluation of each sketch, which never changes, so the same object is the same evaluation */
const evaluations = new WeakMap<Sketch, Evaluation>();

/** The analysis of the last config text. One is enough: edits come one after another, and most of them do not touch the config */
let lastAnalysis: ConfigAnalysis | undefined;

/**
 * Reads and normalizes a config text, or returns the analysis of the last one when the text is the same.
 * @param text The config text.
 * @returns The analysis of the text.
 */
function analyzeConfig(text: string): ConfigAnalysis {
  if (lastAnalysis?.text === text) {
    return lastAnalysis;
  }
  const parsed = parseConfig(text);
  if (!parsed.parsed) {
    // The placeholder config has diagnostics of its own, such as the missing settings, that would only hide the syntax error
    lastAnalysis = {
      text,
      parsed,
      normalized: normalizeConfig({ settings: {}, rules: {} }),
      problems: parsed.problems,
    };
    return lastAnalysis;
  }
  // A policy half typed in the editor makes `normalizeConfig` throw, which would break the workbench
  const normalized = normalizeConfigSafely({
    settings: parsed.value.settings,
    rules: parsed.value.rules,
  });
  lastAnalysis = {
    text,
    parsed,
    normalized,
    problems: [
      ...parsed.problems,
      ...toConfigProblems(normalized.diagnostics, parsed.ast),
    ],
  };
  return lastAnalysis;
}

/**
 * Evaluates a sketch from scratch.
 * @param sketch The sketch to evaluate.
 * @returns What the engine says about it.
 */
function evaluateSketch(sketch: Sketch): Evaluation {
  const { parsed, normalized, problems } = analyzeConfig(sketch.config);
  const { settings } = normalized.value;

  // Sketch paths are relative to its root, which is what `describeEntity` takes without a root path. Every file is local, so there are no sources to describe
  const files = new Map(
    sketch.tree
      .filter(({ kind }) => kind === "file")
      .map(({ path }) => [path, describeEntity(settings, path)] as const)
  );

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
      rangeOf: () => undefined,
    };
  }

  const input = {
    config: parsed,
    settings,
    diagnostics: normalized.diagnostics,
    descriptions: [...files.values()],
  };

  return {
    sketch,
    configParsed: true,
    problems,
    rulesValid: areRulesValid(normalized.diagnostics),
    files,
    elementTypes: summarizeElementTypes(input),
    fileCategories: summarizeFileCategories(input),
    rules: summarizeRules(input),
    rangeOf: (path) => getRangeOf(parsed.ast, path),
  };
}

/**
 * Evaluates a sketch: reads its config and places the problems in its text, and describes every file of its tree as the plugin does. It is pure and memoized, so evaluating the same sketch object again returns the same evaluation, and a sketch with the same config text as the last one does not read the config again.
 * @param sketch The sketch to evaluate.
 * @returns What the engine says about the sketch.
 */
export function evaluate(sketch: Sketch): Evaluation {
  const known = evaluations.get(sketch);
  if (known) {
    return known;
  }
  const evaluation = evaluateSketch(sketch);
  evaluations.set(sketch, evaluation);
  return evaluation;
}
