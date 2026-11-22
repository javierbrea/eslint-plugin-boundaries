import type { Diagnostic } from "@boundaries/config";

import type {
  ElementTypeSummary,
  FileCategorySummary,
  NotEvaluatedReason,
  PolicyRef,
  PolicySummary,
  ProjectConfig,
  RuleSummary,
} from "../Config";

import type {
  DependencyDescription,
  EntityDescription,
} from "./Descriptions.types";

/** What a dependency points to: a file of the project, or a module outside it, such as `react` or `node:fs` */
export type ProjectDependencyTarget =
  | {
      /** A file of the project */
      readonly kind: "file";
      /** Path of the file from the root of the project, such as `src/components/Price/index.ts` */
      readonly path: string;
    }
  | {
      /** A module outside the project */
      readonly kind: "external";
      /** Name of the module, such as `react` or `react/jsx-runtime`. The description of the module comes from the `source` of the dependency, not from this name */
      readonly name: string;
    };

/** A name imported or exported by a dependency */
export type ProjectSpecifier = {
  /** `default` for `import x`, `named` for `import { x }`, `namespace` for `import * as x` */
  readonly kind: "default" | "named" | "namespace";
  /** Name in the target module */
  readonly name: string;
  /** Local name, when it differs from `name` */
  readonly alias?: string;
};

/** Syntax of the statement that creates a dependency: `import`, `export … from`, `require()` or `import()` */
export type ProjectDependencySyntax =
  | "import"
  | "export-from"
  | "require"
  | "dynamic-import";

/** A dependency of a file of the project, as the plugin reads it from the code */
export type ProjectDependency = {
  /** Path of the file that has the dependency, from the root of the project */
  readonly from: string;
  /** What the dependency points to */
  readonly target: ProjectDependencyTarget;
  /** Syntax of the statement */
  readonly syntax: ProjectDependencySyntax;
  /** Whether the statement imports values or only types */
  readonly importKind: "value" | "type";
  /** Names imported or exported by the statement */
  readonly specifiers: readonly ProjectSpecifier[];
  /** The source as the statement writes it, such as `../pages/home` or `react`: required, because the origin of a module depends on it */
  readonly source: string;
};

/** A project to evaluate: its config, its files and the dependencies of its files */
export type Project = {
  /** The boundaries part of its ESLint config, as written */
  readonly config: ProjectConfig;
  /** Paths of its files, from its root, such as `src/components/Price/index.ts` */
  readonly files: readonly string[];
  /** Dependencies of its files */
  readonly dependencies: readonly ProjectDependency[];
};

/** Where a dependency is: its file and its position among the dependencies of that file */
export type DependencyRef = {
  /** Path of the file that has the dependency */
  readonly path: string;
  /** Position among the dependencies of the file, from 0 */
  readonly index: number;
};

/** Why a dependency is not checked: the skip reasons of `@boundaries/policies`, and `not-read` when `boundaries/dependency-nodes` leaves its syntax out, so that the plugin never sees it */
export type SkipReason =
  | "from-ignored"
  | "from-unknown"
  | "to-ignored"
  | "not-local"
  | "unknown-local"
  | "internal"
  | "not-read";

/** What the analysis says about a dependency */
export type DependencyVerdict =
  | {
      /** The rule allows it */
      readonly status: "allowed";
      /** The policy that allowed it, or the default */
      readonly policy: PolicyRef;
    }
  | {
      /** The rule disallows it */
      readonly status: "disallowed";
      /** The policy that disallowed it, or the default. It is `undefined` only when a custom message fails to render: `message` is then the error text, and nothing says which policy decided */
      readonly policy: PolicyRef | undefined;
      /** The message that the plugin reports. When a custom message fails to render, or renders to an empty text, it is the text that says so: ESLint stops with an error there instead of reporting */
      readonly message: string;
      /** `error` for the severity `error` of the rule, `warning` for `warn` */
      readonly level: "error" | "warning";
    }
  | {
      /** The rule does not check it, and it counts as no problem */
      readonly status: "not-checked";
      /** Why the rule does not check it */
      readonly reason: SkipReason;
    }
  | {
      /** No dependency of the project is evaluated: `notEvaluated` of the analysis says why */
      readonly status: "not-evaluated";
    };

/** A dependency of the project with its verdict */
export type DependencyResult = {
  /** The dependency of the input, the same object */
  readonly dependency: ProjectDependency;
  /** Its file and its position among the dependencies of that file */
  readonly ref: DependencyRef;
  /** What the plugin describes of it, or `undefined` when the plugin does not read it, because `boundaries/dependency-nodes` leaves its syntax out. It is described whether or not the dependencies are evaluated, with the settings the analysis uses */
  readonly description: DependencyDescription | undefined;
  /** What the analysis says about it */
  readonly verdict: DependencyVerdict;
};

/** What the analysis says about a project */
export type ProjectAnalysis = {
  /** Every file of the project, by path */
  readonly files: ReadonlyMap<string, EntityDescription>;
  /** A result for every dependency of the project, in the order of `Project.dependencies` */
  readonly dependencies: readonly DependencyResult[];
  /** The diagnostics of the config, with paths from the root of the config object */
  readonly diagnostics: readonly Diagnostic[];
  /** False when an entry of a rule of the plugin fails its schema or has a policy whose selector cannot be normalized: dependencies are not evaluated */
  readonly rulesValid: boolean;
  /** Why no dependency is evaluated, when none is: every verdict is then `not-evaluated`. `undefined` when they are */
  readonly notEvaluated: NotEvaluatedReason | undefined;
  /** The policies of the evaluated rule in their order, then its default, with the dependencies each one decided. Empty when `notEvaluated` is set */
  readonly policies: readonly PolicySummary[];
  /** One per element descriptor as written, with the files of the project it matches */
  readonly elementTypes: readonly ElementTypeSummary[];
  /** One per valid file descriptor, with the files of the project it matches */
  readonly fileCategories: readonly FileCategorySummary[];
  /** One per rule of the plugin written in `rules`, in the order they are written */
  readonly rules: readonly RuleSummary[];
};
