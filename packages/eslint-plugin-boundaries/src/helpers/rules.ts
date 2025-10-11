import type { Rule } from "eslint";
import micromatch from "micromatch";

import type { DependencyInfo } from "../constants/DependencyInfo.types";
import type { FileInfo } from "../constants/ElementsInfo.types";
import type {
  RuleResult,
  RuleMatcher,
  RuleOptionsWithRules,
  CapturedValuesMatcher,
  ExternalLibraryMatcherOptions,
  ExternalRule,
  EntryPointRule,
  ElementTypesRule,
  RuleMatcherElementsCapturedValues,
  ElementMatchers,
  RuleReport,
  ExternalLibraryMatchers,
  CapturedValues,
  RuleResultReport,
} from "../constants/Options.types";
import { PLUGIN_NAME, REPO_URL } from "../constants/plugin";
import type { RuleName } from "../constants/rules";
import type { ImportKind } from "../constants/settings";

import type { RuleMainKey } from "./Helpers.types";
import type { RuleMetaDefinition } from "./Rules.types";
import {
  isArray,
  replaceObjectValuesInTemplates,
  isDependencyInfo,
} from "./utils";

const FROM = "from";

/**
 * Removes the plugin namespace from a rule name.
 * @param ruleName The name of the rule.
 * @returns The rule name without the plugin namespace.
 */
function removePluginNamespace(ruleName: RuleName) {
  return ruleName.replace(`${PLUGIN_NAME}/`, "");
}

/**
 * Returns the documentation URL for an ESLint rule.
 * @param ruleName The name of the rule.
 * @returns The documentation URL for the ESLint rule.
 */
function docsUrl(ruleName: RuleName) {
  return `${REPO_URL}/blob/master/docs/rules/${removePluginNamespace(ruleName)}.md`;
}

/**
 * Returns the meta object for an ESLint rule.
 * @param param0 The rule metadata definition.
 * @returns The meta object for the ESLint rule.
 */
export function meta({
  description,
  schema = [],
  ruleName,
}: RuleMetaDefinition): Pick<Rule.RuleModule, "meta"> {
  return {
    meta: {
      type: "problem",
      docs: {
        url: docsUrl(ruleName),
        description,
        category: "dependencies",
      },
      schema,
    },
  };
}

export function micromatchPatternReplacingObjectsValues(
  pattern: string | string[] | undefined,
  object: Partial<RuleMatcherElementsCapturedValues>,
) {
  let patternToReplace = pattern;
  if (!patternToReplace) {
    return "";
  }
  // Backward compatibility. Possibly unused, because the value is already replaced in the next step.
  // For the moment, keep it to avoid unexpected issues until the oncoming refactor.
  if (object.from) {
    patternToReplace = replaceObjectValuesInTemplates(
      patternToReplace,
      object.from,
    ) as string;
  }
  return Object.keys(object).reduce((replacedPattern, namespace) => {
    if (!object[namespace as keyof typeof object]) {
      return replacedPattern;
    }
    return replaceObjectValuesInTemplates(
      replacedPattern,
      object[namespace as keyof typeof object] || {},
      namespace,
    ) as string;
  }, patternToReplace);
}

export function isObjectMatch(
  objectWithMatchers: CapturedValuesMatcher | ExternalLibraryMatcherOptions,
  object: CapturedValues,
  objectsWithValuesToReplace: RuleMatcherElementsCapturedValues,
) {
  return Object.keys(objectWithMatchers).reduce((isMatch, key) => {
    if (isMatch) {
      if (!object || !object[key as keyof typeof object]) {
        return false;
      }
      const micromatchPattern = micromatchPatternReplacingObjectsValues(
        objectWithMatchers[key as keyof typeof objectWithMatchers] as string,
        objectsWithValuesToReplace,
      );
      return micromatch.isMatch(
        object[key as keyof typeof object],
        micromatchPattern,
      );
    }
    return isMatch;
  }, true);
}

export function rulesMainKey(key: RuleMainKey = FROM) {
  return key;
}

function ruleMatch<
  FileOrDependencyInfo extends FileInfo | DependencyInfo = FileInfo,
  RuleMatchers extends
    | CapturedValuesMatcher
    | ExternalLibraryMatcherOptions = CapturedValuesMatcher,
>(
  ruleMatchers: ElementMatchers | ExternalLibraryMatchers,
  targetElement: FileInfo | DependencyInfo,
  isMatch: RuleMatcher<FileOrDependencyInfo, RuleMatchers>,
  fromElement: FileInfo,
  importKind?: ImportKind,
): RuleResult {
  let match: RuleResult = { result: false, report: null, ruleReport: null };
  const matchers = !isArray(ruleMatchers) ? [ruleMatchers] : ruleMatchers;
  matchers.forEach((matcher) => {
    if (!match.result) {
      if (isArray(matcher)) {
        const [value, captures] = matcher;
        match = isMatch(
          targetElement as FileOrDependencyInfo,
          value,
          captures as RuleMatchers,
          {
            from: fromElement.capturedValues,
            target: targetElement.capturedValues,
          },
          importKind,
        );
      } else {
        match = isMatch(
          targetElement as FileOrDependencyInfo,
          matcher as string,
          {} as RuleMatchers,
          {
            from: fromElement.capturedValues,
            target: targetElement.capturedValues,
          },
          importKind,
        );
      }
    }
  });
  return match;
}

export function isMatchElementKey(
  elementInfo: FileInfo | DependencyInfo,
  matcher: string,
  options: CapturedValuesMatcher | ExternalLibraryMatcherOptions,
  elementKey: keyof FileInfo | keyof DependencyInfo,
  elementsToCompareCapturedValues: RuleMatcherElementsCapturedValues,
) {
  const isMatch = micromatch.isMatch(
    elementInfo[elementKey as keyof typeof elementInfo] as string,
    micromatchPatternReplacingObjectsValues(
      matcher,
      elementsToCompareCapturedValues,
    ),
  );
  if (isMatch && options) {
    return {
      result: isObjectMatch(
        options,
        elementInfo.capturedValues,
        elementsToCompareCapturedValues,
      ),
      report: null,
      ruleReport: null,
    };
  }
  return {
    result: isMatch,
    report: null,
    ruleReport: null,
  };
}

export function isMatchImportKind(
  elementInfo: DependencyInfo | FileInfo,
  importKind?: ImportKind,
) {
  if (!isDependencyInfo(elementInfo) || !importKind) {
    return true;
  }
  return micromatch.isMatch(elementInfo.importKind, importKind);
}

export function isMatchElementType(
  elementInfo: FileInfo,
  matcher: string,
  options: CapturedValuesMatcher | ExternalLibraryMatcherOptions,
  elementsToCompareCapturedValues: RuleMatcherElementsCapturedValues,
  importKind?: ImportKind,
) {
  if (!isMatchImportKind(elementInfo, importKind)) {
    return { result: false, report: null, ruleReport: null };
  }
  return isMatchElementKey(
    elementInfo,
    matcher,
    options,
    "type",
    elementsToCompareCapturedValues,
  );
}

export function getElementRules<
  FileOrDependencyInfo extends FileInfo | DependencyInfo = FileInfo,
  RuleMatchers extends
    | CapturedValuesMatcher
    | ExternalLibraryMatcherOptions = CapturedValuesMatcher,
>(
  targetElement: FileInfo | DependencyInfo,
  options: RuleOptionsWithRules,
  fromElement: FileInfo | DependencyInfo,
  mainKey?: RuleMainKey,
): ((ExternalRule | EntryPointRule | ElementTypesRule) & { index: number })[] {
  if (!options.rules) {
    return [];
  }
  const key = rulesMainKey(mainKey);
  return options.rules
    .map((rule, index) => {
      return {
        ...rule,
        index,
      };
    })
    .filter((rule) => {
      return ruleMatch<FileOrDependencyInfo, RuleMatchers>(
        // TODO: Improve typing, so TypeScript can determine the type of the rule, and if the key is valid
        rule[key as keyof typeof rule] as unknown as ElementMatchers,
        targetElement,
        isMatchElementType,
        fromElement,
      ).result;
    }) as ((ExternalRule | EntryPointRule | ElementTypesRule) & {
    index: number;
  })[];
}

function isFromRule(mainKey?: RuleMainKey) {
  return rulesMainKey(mainKey) === FROM;
}

function elementToGetRulesFrom(
  element: FileInfo,
  dependency: DependencyInfo,
  mainKey?: RuleMainKey,
): FileInfo | DependencyInfo {
  if (!isFromRule(mainKey)) {
    return dependency;
  }
  return element;
}

export function elementRulesAllowDependency<
  FileOrDependencyInfo extends FileInfo | DependencyInfo = FileInfo,
  RuleMatchers extends
    | CapturedValuesMatcher
    | ExternalLibraryMatcherOptions = CapturedValuesMatcher,
>({
  element,
  dependency,
  options = {},
  isMatch,
  rulesMainKey: mainKey,
}: {
  element: FileInfo;
  dependency: DependencyInfo;
  options?: RuleOptionsWithRules;
  isMatch: RuleMatcher<FileOrDependencyInfo, RuleMatchers>;
  rulesMainKey?: RuleMainKey;
}): RuleResult {
  const targetElement = elementToGetRulesFrom(element, dependency, mainKey);

  const initialReportResult: Partial<RuleReport> = {
    isDefault: true,
    message: options.message,
  };

  const initialReport: [
    RuleResult["result"],
    RuleResultReport | null,
    RuleReport | null,
  ] = [
    // TODO: Use value from map
    options.default === "allow",
    null,
    initialReportResult as RuleReport,
  ];

  const elementRules = getElementRules<FileOrDependencyInfo, RuleMatchers>(
    targetElement,
    options,
    targetElement === element ? dependency : element,
    mainKey,
  );

  // @ts-expect-error TODO: Improve typing, and probably split this logic. One for each type of rule, so types are not mixed
  const [result, report, ruleReport] = elementRules.reduce((allowed, rule) => {
    if (rule.disallow) {
      const match = ruleMatch<FileOrDependencyInfo, RuleMatchers>(
        rule.disallow,
        dependency,
        isMatch,
        element,
        rule.importKind,
      );
      if (match.result) {
        return [
          false,
          match.report,
          {
            // TODO: Improve typing, so TypeScript can determine the type of the rule, if the key is valid, and the type of element
            element: rule[
              rulesMainKey(mainKey) as keyof typeof rule
            ] as unknown as FileInfo | DependencyInfo,
            disallow: rule.disallow,
            index: rule.index,
            message: rule.message || options.message,
            importKind: rule.importKind,
          },
        ];
      }
    }
    if (rule.allow) {
      const match = ruleMatch<FileOrDependencyInfo, RuleMatchers>(
        rule.allow,
        dependency,
        isMatch,
        element,
        rule.importKind,
      );
      if (match.result) {
        return [true, match.report, null];
      }
    }
    return allowed;
  }, initialReport);

  return {
    result,
    report,
    ruleReport,
  };
}
