import { DEPENDENCY_NODE_KEYS_MAP } from "@boundaries/config";
import type {
  DependenciesRuleOptionsNormalized,
  SettingsNormalized,
} from "@boundaries/config";
import type { DependencyDescription as PluginDependencyDescription } from "@boundaries/elements";
import { describeDependency, evaluateDependency } from "@boundaries/policies";

import type { SketchDependency, SketchDependencySyntax } from "@/contract";
import { getDependencySource } from "@/domains/project/helpers/sketch";

import type {
  DependenciesInput,
  DependencyJudgment,
} from "./dependencies.types";
import { getReadNodeKinds } from "./dependencyNodes";
import { toDependencyDescription } from "./descriptions";
import type { DependencyResult, DependencyVerdict } from "./engine.types";
import type { EvaluatedRule } from "./evaluatedRule.types";

/** The verdict of every dependency while none is evaluated */
const NOT_EVALUATED: DependencyVerdict = { status: "not-evaluated" };

/** The verdict of a dependency whose syntax `boundaries/dependency-nodes` leaves out */
const NOT_READ: DependencyVerdict = {
  status: "not-checked",
  reason: "not-read",
};

/** The name that the plugin gives the dependency nodes of each syntax, which `boundaries/dependency-nodes` selects and the policies match as `nodeKind` */
const NODE_KINDS: Readonly<Record<SketchDependencySyntax, string>> = {
  import: DEPENDENCY_NODE_KEYS_MAP.IMPORT,
  "export-from": DEPENDENCY_NODE_KEYS_MAP.EXPORT,
  require: DEPENDENCY_NODE_KEYS_MAP.REQUIRE,
  "dynamic-import": DEPENDENCY_NODE_KEYS_MAP.DYNAMIC_IMPORT,
};

/**
 * Reads the names of a statement as the plugin reads them from the code, which are what the `specifiers` of a dependency selector match.
 * @param dependency The dependency.
 * @param dependency.syntax
 * @param dependency.specifiers
 * @returns For an `import`, the imported names of its named specifiers, and not their aliases. For an `export … from`, the exported names of its named specifiers, which are the aliases when there are. None for a default or a namespace specifier, nor for a `require()` or an `import()`.
 */
function getSpecifiers({ syntax, specifiers }: SketchDependency): string[] {
  if (syntax !== "import" && syntax !== "export-from") {
    return [];
  }
  return specifiers
    .filter(({ kind }) => kind === "named")
    .map(({ name: imported, alias }) =>
      syntax === "export-from" ? (alias ?? imported) : imported
    );
}

/**
 * Explains a custom message that renders to an empty text, for which ESLint stops with an error instead of reporting.
 * @param options The options of the rule.
 * @param policyIndex The index of the policy that decided the dependency, or `null` when the default did.
 * @returns A sentence that names the template and where it is set: the message of the policy that decided when it has one, and otherwise the one of the rule options, as `@boundaries/policies` resolves it.
 */
function explainEmptyMessage(
  options: DependenciesRuleOptionsNormalized,
  policyIndex: number | null
): string {
  const policyMessage =
    policyIndex === null ? undefined : options.policies[policyIndex].message;
  const template = policyMessage ?? options.message;
  const owner =
    policyMessage === undefined
      ? "the rule options"
      : `the policy at index ${policyIndex}`;
  return `The custom message ${JSON.stringify(template)} of ${owner} renders to an empty text for this dependency, and ESLint stops with an error when a rule reports a problem with no message.`;
}

/**
 * Decides a dependency as the `dependencies` rule does.
 * @param description What the plugin describes of the dependency, or `undefined` when it does not read it.
 * @param settings The normalized settings.
 * @param rule The rule that decides, or `undefined` when no dependency is evaluated.
 * @returns Not evaluated when there is no rule, not checked when the plugin does not read the syntax of the dependency or the rule skips it, and otherwise allowed or disallowed with the policy that decided. A custom message that fails to render makes it disallowed, with the error text and no policy. A custom message that renders to an empty text makes it disallowed too, with the policy that decided and a message that says so, because ESLint stops with an error when a rule reports a problem with no message, and the playground cannot stop.
 */
function judge(
  description: PluginDependencyDescription | undefined,
  settings: SettingsNormalized,
  rule: EvaluatedRule | undefined
): DependencyVerdict {
  if (rule === undefined) {
    return NOT_EVALUATED;
  }
  if (description === undefined) {
    return NOT_READ;
  }

  try {
    const evaluation = evaluateDependency(settings, rule.options, description);
    if (!evaluation.checked) {
      return { status: "not-checked", reason: evaluation.reason };
    }
    const policy =
      evaluation.policyIndex === null
        ? rule.defaultPolicy
        : rule.policies[evaluation.policyIndex];
    return evaluation.allowed
      ? { status: "allowed", policy }
      : {
          status: "disallowed",
          policy,
          message:
            evaluation.message === ""
              ? explainEmptyMessage(rule.options, evaluation.policyIndex)
              : evaluation.message,
          level: rule.level,
        };
  } catch (error) {
    // `evaluateDependency` throws an `Error` that names the message that fails to render and where it is set
    return {
      status: "disallowed",
      policy: undefined,
      message: (error as Error).message,
      level: rule.level,
    };
  }
}

/**
 * Describes a dependency as the plugin does, once, and decides it with that description.
 * @param dependency The dependency.
 * @param source The source its statement writes.
 * @param judgment What the rule decides with.
 * @param judgment.settings
 * @param judgment.readNodeKinds
 * @param judgment.rule
 * @returns Its description, which is `undefined` when the plugin does not read its syntax, and its verdict, which is the same description judged, so the plugin is asked only once.
 */
function describeAndJudge(
  dependency: SketchDependency,
  source: string,
  { settings, readNodeKinds, rule }: DependencyJudgment
): Pick<DependencyResult, "description" | "verdict"> {
  const nodeKind = NODE_KINDS[dependency.syntax];
  // The playground reads a syntax only through the built-in selectors of `boundaries/dependency-nodes`
  if (!readNodeKinds.has(nodeKind)) {
    return {
      description: undefined,
      verdict: judge(undefined, settings, rule),
    };
  }

  const { target } = dependency;
  const described = describeDependency(settings, {
    from: dependency.from,
    to: target.kind === "node" ? target.path : undefined,
    source,
    kind: dependency.importKind,
    nodeKind,
    specifiers: getSpecifiers(dependency),
  });
  return {
    description: toDependencyDescription(described),
    verdict: judge(described, settings, rule),
  };
}

/**
 * Decides every dependency of a sketch.
 * @param input The sketch, the settings and the rule.
 * @param input.sketch
 * @param input.settings
 * @param input.rule
 * @returns A result for each dependency, in the order of `Sketch.dependencies`, with the source its statement writes, in full (the relative path of the target with its extension and its `index`, or the name of an external module), which is the one `describeDependency` receives, its position among the dependencies of its file and its description, which is made once and also decides the verdict. Every verdict is `not-evaluated` when there is no rule to evaluate, and the description is `undefined` for a dependency whose syntax the plugin does not read.
 */
export function evaluateDependencies({
  sketch,
  settings,
  rule,
}: DependenciesInput): DependencyResult[] {
  const seen = new Map<string, number>();
  const readNodeKinds = getReadNodeKinds(settings);

  return sketch.dependencies.map((dependency): DependencyResult => {
    const index = seen.get(dependency.from) ?? 0;
    seen.set(dependency.from, index + 1);
    const source = getDependencySource(dependency);
    return {
      dependency,
      ref: { path: dependency.from, index },
      source,
      ...describeAndJudge(dependency, source, {
        settings,
        readNodeKinds,
        rule,
      }),
    };
  });
}
