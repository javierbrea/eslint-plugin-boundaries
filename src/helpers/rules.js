const micromatch = require("micromatch");

const REPO_URL = "https://github.com/javierbrea/eslint-plugin-boundaries";

function docsUrl(ruleName) {
  return `${REPO_URL}/blob/master/docs/rules/${ruleName}.md`;
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

function isObjectMatch(objectWithMatchers, object) {
  return Object.keys(objectWithMatchers).reduce((isMatch, key) => {
    if (isMatch === false) {
      return false;
    }
    return micromatch.isMatch(object[key], objectWithMatchers[key]);
  }, null);
}

function rulesMainKey(key) {
  return key || "from";
}

function ruleMatch(ruleMatchers, elementInfo, isMatch) {
  let match = { result: false, report: null };
  const matchers = !Array.isArray(ruleMatchers) ? [ruleMatchers] : ruleMatchers;
  matchers.forEach((matcher) => {
    if (!match.result) {
      if (Array.isArray(matcher)) {
        const [value, captures] = matcher;
        match = isMatch(elementInfo, value, captures);
      } else {
        match = isMatch(elementInfo, matcher);
      }
    }
  });
  return match;
}

function isMatchElementKey(elementInfo, matcher, options, elementKey) {
  const isMatch = micromatch.isMatch(elementInfo[elementKey], matcher);
  if (isMatch && options) {
    return {
      result: isObjectMatch(options, elementInfo.capturedValues),
    };
  }
  return {
    result: isMatch,
  };
}

function isMatchElementType(elementInfo, matcher, options) {
  return isMatchElementKey(elementInfo, matcher, options, "type");
}

function getElementRules(elementInfo, options, mainKey) {
  if (!options.rules) {
    return [];
  }
  const key = rulesMainKey(mainKey);
  return options.rules.filter((rule) => {
    return ruleMatch(rule[key], elementInfo, isMatchElementType).result;
  });
}

function elementRulesAllowDependency({
  element,
  dependency,
  options,
  isMatch,
  rulesMainKey: mainKey,
}) {
  const [result, report] = getElementRules(element, options, mainKey).reduce(
    (allowed, rule) => {
      if (rule.disallow) {
        const match = ruleMatch(rule.disallow, dependency, isMatch);
        if (match.result) {
          return [false, match.report];
        }
      }
      if (rule.allow) {
        const match = ruleMatch(rule.allow, dependency, isMatch);
        if (match.result) {
          return [true, match.report];
        }
      }
      return allowed;
    },
    [options.default === "allow", null]
  );
  return {
    result,
    report,
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
};
