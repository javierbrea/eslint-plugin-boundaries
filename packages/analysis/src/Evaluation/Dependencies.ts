import { DEPENDENCY_NODE_KEYS_MAP } from "@boundaries/config";
import type { DependenciesRuleOptionsNormalized } from "@boundaries/config";
import type { DependencyDescription as PluginDependencyDescription } from "@boundaries/elements";

import { getReadNodes } from "../Config";

import type {
  DependenciesInput,
  DependencyJudgment,
} from "./Dependencies.types";
import { toDependencyDescription } from "./Descriptions";
import type {
  DependencyResult,
  DependencyVerdict,
  ProjectDependency,
  ProjectDependencySyntax,
} from "./Evaluation.types";

/** The verdict of every dependency while none is evaluated */
const NOT_EVALUATED: DependencyVerdict = { status: "not-evaluated" };

/** The verdict of a dependency that no dependency node of the settings reads */
const NOT_READ: DependencyVerdict = {
  status: "not-checked",
  reason: "not-read",
};

/** The key of the built-in nodes of each syntax in `DEFAULT_DEPENDENCY_NODES`, which `boundaries/dependency-nodes` selects */
const NODE_KEYS: Readonly<Record<ProjectDependencySyntax, string>> = {
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
function getSpecifiers({ syntax, specifiers }: ProjectDependency): string[] {
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
 * @param judgment What the rule decides with.
 * @param judgment.policies
 * @param judgment.settings
 * @param judgment.rule
 * @returns Not evaluated when there is no rule, not checked when the plugin does not read the dependency or the rule skips it, and otherwise allowed or disallowed with the policy that decided, the `PolicyRef` of the rule with its path in the config object. A custom message that fails to render makes it disallowed, with the error text and no policy. A custom message that renders to an empty text makes it disallowed too, with the policy that decided and a message that says so, because ESLint stops with an error when a rule reports a problem with no message, and the analysis cannot stop.
 */
function judge(
  description: PluginDependencyDescription | undefined,
  {
    policies,
    settings,
    rule,
  }: Pick<DependencyJudgment, "policies" | "settings" | "rule">
): DependencyVerdict {
  if (rule === undefined) {
    return NOT_EVALUATED;
  }
  if (description === undefined) {
    return NOT_READ;
  }

  try {
    const evaluation = policies.evaluateDependency(
      settings,
      rule.options,
      description
    );
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
 * @param dependency The dependency, with the source its statement writes.
 * @param judgment What the rule decides with.
 * @param judgment.policies
 * @param judgment.settings
 * @param judgment.readNodes
 * @param judgment.rule
 * @returns Its description, which is `undefined` when no node reads its syntax and its import kind, and otherwise has the `name` of that node as its `nodeKind`, or `null` when that `name` is empty or missing, and the `kind` of that node as its `kind`, or `value` when the node has none, as the plugin passes them; and its verdict, which is the same description judged, so the plugin is asked only once.
 */
function describeAndJudge(
  dependency: ProjectDependency,
  judgment: DependencyJudgment
): Pick<DependencyResult, "description" | "verdict"> {
  const { policies, settings, readNodes } = judgment;
  // The analysis reads a dependency only through a node that repeats a built-in selector of its syntax and its import kind
  const node = readNodes
    .get(NODE_KEYS[dependency.syntax])
    ?.get(dependency.importKind);
  if (node === undefined) {
    return {
      description: undefined,
      verdict: judge(undefined, judgment),
    };
  }

  const { target } = dependency;
  const described = policies.describeDependency(settings, {
    from: dependency.from,
    // Surviving Stryker mutant: the `true` replacement of the condition survives, because an external target has no `path`, so `target.path` is `undefined` for it as well
    to: target.kind === "file" ? target.path : undefined,
    source: dependency.source,
    kind: node.kind || "value",
    nodeKind: node.name,
    specifiers: getSpecifiers(dependency),
  });
  return {
    description: toDependencyDescription(described),
    verdict: judge(described, judgment),
  };
}

/**
 * Decides every dependency of a project.
 * @param input The dependencies of the project, the `Policies` instance that describes and decides them, the settings and the rule.
 * @param input.dependencies
 * @param input.policies
 * @param input.settings
 * @param input.rule
 * @returns A result for each dependency, in the order of the input, with the dependency itself, whose `source` is the one that `describeDependency` of the instance receives, its position among the dependencies of its file and its description, which is made once and also decides the verdict. Every verdict is `not-evaluated` when there is no rule to evaluate, and the description is `undefined` for a dependency that the analysis does not read, because no node repeats a built-in selector of its syntax and its import kind.
 */
export function evaluateDependencies({
  dependencies,
  policies,
  settings,
  rule,
}: DependenciesInput): DependencyResult[] {
  const seen = new Map<string, number>();
  const readNodes = getReadNodes(settings);

  return dependencies.map((dependency): DependencyResult => {
    const index = seen.get(dependency.from) ?? 0;
    seen.set(dependency.from, index + 1);
    return {
      dependency,
      ref: { path: dependency.from, index },
      ...describeAndJudge(dependency, { policies, settings, readNodes, rule }),
    };
  });
}
