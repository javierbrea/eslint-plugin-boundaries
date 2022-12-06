const micromatch = require("micromatch");

const { isArray, replaceObjectValuesInTemplates } = require("./utils");

const REPO_URL = "https://github.com/javierbrea/eslint-plugin-boundaries";
const FROM = "from";

function removePluginNamespace(ruleName) {
  return ruleName.replace("boundaries/", "");
}

function docsUrl(ruleName) {
  return `${REPO_URL}/blob/master/docs/rules/${removePluginNamespace(ruleName)}.md`;
}

function meta({ description, schema = [], ruleName }) {
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

function dependencyLocation(node, context) {
  const columnStart = context.getSourceCode().getText(node).indexOf(node.source.value) - 1;
  const columnEnd = columnStart + node.source.value.length + 2;
  return {
    loc: {
      start: {
        line: node.loc.start.line,
        column: columnStart,
      },
      end: {
        line: node.loc.end.line,
        column: columnEnd,
      },
    },
  };
}

function micromatchPatternReplacingObjectsValues(pattern, object) {
  let patternToReplace = pattern;
  // Backward compatibility
  if (object.from) {
    patternToReplace = replaceObjectValuesInTemplates(patternToReplace, object.from);
  }
  return Object.keys(object).reduce((replacedPattern, namespace) => {
    if (!object[namespace]) {
      return replacedPattern;
    }
    return replaceObjectValuesInTemplates(replacedPattern, object[namespace], namespace);
  }, patternToReplace);
}

function isObjectMatch(objectWithMatchers, object, objectsWithValuesToReplace) {
  return Object.keys(objectWithMatchers).reduce((isMatch, key) => {
    if (isMatch) {
      const micromatchPattern = micromatchPatternReplacingObjectsValues(
        objectWithMatchers[key],
        objectsWithValuesToReplace
      );
      return micromatch.isMatch(object[key], micromatchPattern);
    }
    return isMatch;
  }, true);
}

function rulesMainKey(key) {
  return key || FROM;
}

function ruleMatch(ruleMatchers, targetElement, isMatch, fromElement) {
  let match = { result: false, report: null };
  const matchers = !isArray(ruleMatchers) ? [ruleMatchers] : ruleMatchers;
  matchers.forEach((matcher) => {
    if (!match.result) {
      if (isArray(matcher)) {
        const [value, captures] = matcher;
        match = isMatch(targetElement, value, captures, {
          from: fromElement.capturedValues,
          target: targetElement.capturedValues,
        });
      } else {
        match = isMatch(
          targetElement,
          matcher,
          {},
          {
            from: fromElement.capturedValues,
            target: targetElement.capturedValues,
          }
        );
      }
    }
  });
  return match;
}

function isMatchElementKey(
  elementInfo,
  matcher,
  options,
  elementKey,
  elementsToCompareCapturedValues
) {
  const isMatch = micromatch.isMatch(
    elementInfo[elementKey],
    micromatchPatternReplacingObjectsValues(matcher, elementsToCompareCapturedValues)
  );
  if (isMatch && options) {
    return {
      result: isObjectMatch(options, elementInfo.capturedValues, elementsToCompareCapturedValues),
    };
  }
  return {
    result: isMatch,
  };
}

function isMatchElementType(elementInfo, matcher, options, elementsToCompareCapturedValues) {
  return isMatchElementKey(elementInfo, matcher, options, "type", elementsToCompareCapturedValues);
}

function getElementRules(elementInfo, options, mainKey) {
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
      return ruleMatch(rule[key], elementInfo, isMatchElementType, elementInfo).result;
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

function elementRulesAllowDependency({
  element,
  dependency,
  options,
  isMatch,
  rulesMainKey: mainKey,
}) {
  const [result, report, ruleReport] = getElementRules(
    elementToGetRulesFrom(element, dependency, mainKey),
    options,
    mainKey
  ).reduce(
    (allowed, rule) => {
      if (rule.disallow) {
        const match = ruleMatch(rule.disallow, dependency, isMatch, element);
        if (match.result) {
          return [
            false,
            match.report,
            {
              element: rule[rulesMainKey(mainKey)],
              disallow: rule.disallow,
              index: rule.index,
              message: rule.message || options.message,
            },
          ];
        }
      }
      if (rule.allow) {
        const match = ruleMatch(rule.allow, dependency, isMatch, element);
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
    ]
  );
  return {
    result,
    report,
    ruleReport,
  };
}

module.exports = {
  meta,
  dependencyLocation,
  isObjectMatch,
  isMatchElementKey,
  isMatchElementType,
  elementRulesAllowDependency,
  getElementRules,
  rulesMainKey,
  micromatchPatternReplacingObjectsValues,
};
