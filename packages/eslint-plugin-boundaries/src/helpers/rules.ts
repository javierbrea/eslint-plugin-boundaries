import type { Rule } from "eslint";
import micromatch from "micromatch";

import { PLUGIN_NAME, REPO_URL } from "src/constants/plugin";
import type { RuleName } from "src/constants/rules";

import type {
  RuleResult,
  RuleMatcher,
  RuleOptionsWithRules,
  CapturedValuesMatcher,
  ExternalLibraryDetailsMatcher,
} from "../constants/Options.types";
import type { DependencyInfo } from "../core/DependencyInfo.types";
import type { FileInfo } from "../core/ElementsInfo.types";

import type { RuleMainKey } from "./Helpers.types";
import type { RuleMetaDefinition } from "./Rules.types";
import { isArray, replaceObjectValuesInTemplates } from "./utils";

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

export function micromatchPatternReplacingObjectsValues(pattern, object) {
  let patternToReplace = pattern;
  // Backward compatibility
  if (object.from) {
    patternToReplace = replaceObjectValuesInTemplates(
      patternToReplace,
      object.from,
    );
  }
  return Object.keys(object).reduce((replacedPattern, namespace) => {
    if (!object[namespace]) {
      return replacedPattern;
    }
    return replaceObjectValuesInTemplates(
      replacedPattern,
      object[namespace],
      namespace,
    );
  }, patternToReplace);
}

export function isObjectMatch(
  objectWithMatchers,
  object,
  objectsWithValuesToReplace,
) {
  return Object.keys(objectWithMatchers).reduce((isMatch, key) => {
    if (isMatch) {
      if (!object || !object[key]) {
        return false;
      }
      const micromatchPattern = micromatchPatternReplacingObjectsValues(
        objectWithMatchers[key],
        objectsWithValuesToReplace,
      );
      return micromatch.isMatch(object[key], micromatchPattern);
    }
    return isMatch;
  }, true);
}

export function rulesMainKey(key: RuleMainKey = FROM) {
  return key;
}

function ruleMatch(
  ruleMatchers,
  targetElement,
  isMatch,
  fromElement,
  importKind,
) {
  let match = { result: false, report: null };
  const matchers = !isArray(ruleMatchers) ? [ruleMatchers] : ruleMatchers;
  matchers.forEach((matcher) => {
    if (!match.result) {
      if (isArray(matcher)) {
        const [value, captures] = matcher;
        match = isMatch(
          targetElement,
          value,
          captures,
          {
            from: fromElement.capturedValues,
            target: targetElement.capturedValues,
          },
          importKind,
        );
      } else {
        match = isMatch(
          targetElement,
          matcher,
          {},
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
  elementInfo,
  matcher,
  options,
  elementKey: keyof FileInfo,
  elementsToCompareCapturedValues,
) {
  const isMatch = micromatch.isMatch(
    elementInfo[elementKey],
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
    };
  }
  return {
    result: isMatch,
  };
}

export function isMatchImportKind(elementInfo, importKind) {
  if (!elementInfo.importKind || !importKind) {
    return true;
  }
  return micromatch.isMatch(elementInfo.importKind, importKind);
}

export function isMatchElementType(
  elementInfo,
  matcher,
  options,
  elementsToCompareCapturedValues,
  importKind,
) {
  if (!isMatchImportKind(elementInfo, importKind)) {
    return { result: false };
  }
  return isMatchElementKey(
    elementInfo,
    matcher,
    options,
    "type",
    elementsToCompareCapturedValues,
  );
}

export function getElementRules(
  targetElement,
  options,
  mainKey: RuleMainKey,
  fromElement,
) {
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
      return ruleMatch(
        rule[key],
        targetElement,
        isMatchElementType,
        fromElement,
      ).result;
    });
}

function isFromRule(mainKey: RuleMainKey) {
  return rulesMainKey(mainKey) === FROM;
}

function elementToGetRulesFrom(element, dependency, mainKey: RuleMainKey) {
  if (!isFromRule(mainKey)) {
    return dependency;
  }
  return element;
}

export function elementRulesAllowDependency<
  FileOrDependencyInfo extends FileInfo | DependencyInfo = FileInfo,
  RuleMatchers extends
    | CapturedValuesMatcher
    | ExternalLibraryDetailsMatcher = CapturedValuesMatcher,
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
  const [result, report, ruleReport] = getElementRules(
    targetElement,
    options,
    mainKey,
    targetElement === element ? dependency : element,
  ).reduce(
    (allowed, rule) => {
      if (rule.disallow) {
        const match = ruleMatch(
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
              element: rule[rulesMainKey(mainKey)],
              disallow: rule.disallow,
              index: rule.index,
              message: rule.message || options.message,
              importKind: rule.importKind,
            },
          ];
        }
      }
      if (rule.allow) {
        const match = ruleMatch(
          rule.allow,
          dependency,
          isMatch,
          element,
          rule.importKind,
        );
        if (match.result) {
          return [true, match.report];
        }
      }
      return allowed;
    },
    [
      // TODO: Use value from map
      options.default === "allow",
      null,
      {
        isDefault: true,
        message: options.message,
      },
    ],
  );
  return {
    result,
    report,
    ruleReport,
  };
}
