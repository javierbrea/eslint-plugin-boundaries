import type { ConfigAnalysis } from "../Config";

import {
  addElementTypeFiles,
  addFileCategoryFiles,
  addPolicyDecisions,
} from "./Counts";
import { evaluateDependencies } from "./Dependencies";
import { describeFiles } from "./DescribeFiles";
import type { Project, ProjectAnalysis } from "./Evaluation.types";

/**
 * Evaluates a project against a config that `analyzeConfig` analyzed, without reading the config as written: it describes its files and decides its dependencies as the plugin does. An analysis can be evaluated against any number of projects, and nothing is kept between calls.
 * @param analysis The analysis of the config, as `analyzeConfig` returns it.
 * @param project The files of the project and their dependencies; its config is not read.
 * @returns The description of every file, a result for every dependency in the order of the project, and the diagnostics, the validity of the rules, the reason no dependency is evaluated and the summaries of the rules of the analysis, the same objects. The summaries of the element types, the file categories and the policies are those of the analysis, with the files of the project that each descriptor matches and the dependencies that each policy decided; no policy is summarized when no rule is evaluated.
 */
export function evaluateProject(
  analysis: ConfigAnalysis,
  project: Pick<Project, "files" | "dependencies">
): ProjectAnalysis {
  const { files, elementDescriptorFiles, fileDescriptorFiles } = describeFiles(
    analysis.settings,
    project.files
  );
  const dependencies = evaluateDependencies({
    dependencies: project.dependencies,
    settings: analysis.settings,
    rule: analysis.rule,
  });

  return {
    files,
    dependencies,
    diagnostics: analysis.diagnostics,
    rulesValid: analysis.rulesValid,
    notEvaluated: analysis.notEvaluated,
    // The analysis summarizes no policy when no rule is evaluated
    policies: addPolicyDecisions(analysis.policies, dependencies),
    elementTypes: addElementTypeFiles(
      analysis.elementTypes,
      elementDescriptorFiles
    ),
    fileCategories: addFileCategoryFiles(
      analysis.fileCategories,
      fileDescriptorFiles
    ),
    rules: analysis.rules,
  };
}
