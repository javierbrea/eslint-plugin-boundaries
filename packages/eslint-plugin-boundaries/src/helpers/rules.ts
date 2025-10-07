import micromatch from "micromatch";

import { isArray, replaceObjectValuesInTemplates } from "./utils";

const REPO_URL = "https://github.com/javierbrea/eslint-plugin-boundaries";
const FROM = "from";

function removePluginNamespace(ruleName) {
  return ruleName.replace("boundaries/", "");
}

function docsUrl(ruleName) {
  return `${REPO_URL}/blob/master/docs/rules/${removePluginNamespace(ruleName)}.md`;
}

export function meta({ description, schema = [], ruleName }) {
  return {
    meta: {
      type: "problem",
      docs: {
        url: docsUrl(ruleName),
        description,
        category: "dependencies",
      },
      fixable: null,
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

export function rulesMainKey(key) {
  return key || FROM;
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
  elementKey,
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

export function getElementRules(targetElement, options, mainKey, fromElement) {
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

function isFromRule(mainKey) {
  return rulesMainKey(mainKey) === FROM;
}

function elementToGetRulesFrom(element, dependency, mainKey) {
  if (!isFromRule(mainKey)) {
    return dependency;
  }
  return element;
}

export function elementRulesAllowDependency({
  element,
  dependency,
  options,
  isMatch,
  rulesMainKey: mainKey,
}) {
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

module.exports = {
  meta,
  isObjectMatch,
  isMatchElementKey,
  isMatchElementType,
  elementRulesAllowDependency,
  getElementRules,
  rulesMainKey,
  micromatchPatternReplacingObjectsValues,
  isMatchImportKind,
};
