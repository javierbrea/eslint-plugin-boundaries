const chalk = require("chalk");
const micromatch = require("micromatch");

const { TYPES } = require("../constants/settings");
const { PLUGIN_NAME } = require("../constants/plugin");
const { getElementInfo } = require("./elements");

// TODO, remove
const warns = [];

// TODO, remove
const warn = (message) => {
  if (!warns.includes(message)) {
    console.warn(chalk.yellow(`[${PLUGIN_NAME}]: ${message}`));
    warns.push(message);
  }
};

// TODO, remove
const validateSettings = (context) => {
  if (!context.settings[TYPES] || !context.settings[TYPES].length) {
    warn(`Please provide element types using the '${TYPES}' setting`);
  }
};

// TODO, remove
const checkOptions = (context, property, ruleName, validate) => {
  const options = context.options;
  const settings = context.settings;
  const optionToCheck = options[0] && options[0][property];
  if (optionToCheck) {
    Object.keys(optionToCheck).forEach((type) => {
      if (!settings[TYPES].includes(type)) {
        warn(`Invalid element type '${type}' in '${ruleName}' rule config`);
      }
      if (!Array.isArray(optionToCheck[type])) {
        warn(
          `Invalid config in '${ruleName}' rule for '${type}' elements. Please provide an array of valid elements`
        );
      } else {
        optionToCheck[type].forEach((element) => {
          if (validate) {
            validate(type, element, context);
          }
        });
      }
    });
  } else {
    warn(`Required property '${property}' not found in '${ruleName}' config`);
  }
};

const REPO_URL = "https://github.com/javierbrea/eslint-plugin-boundaries";

function docsUrl(ruleName) {
  return `${REPO_URL}/blob/master/docs/rules/${ruleName}.md`;
}

function meta2({ description, schema = [], ruleName }) {
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

// TODO, remove
function meta(description, category, schema = [], ruleName) {
  return meta2({ description, schema, ruleName });
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
    if (isMatch && micromatch.isMatch(object[key], objectWithMatchers[key])) {
      return false;
    }
    return isMatch;
  }, true);
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
  if (isMatch && options && isObjectMatch(options, elementInfo.capturedValues)) {
    return {
      result: true,
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

// TODO, remove
const getContextInfo = (context) => {
  validateSettings(context);
  const fileName = context.getFilename();
  const currentElementInfo = getElementInfo(fileName, context.settings);
  return { fileName, currentElementInfo };
};

module.exports = {
  checkOptions,
  meta,
  meta2,
  dependencyLocation,
  validateSettings,
  warn,
  getContextInfo,
  isObjectMatch,
  isMatchElementKey,
  isMatchElementType,
  elementRulesAllowDependency,
  getElementRules,
  rulesMainKey,
};
