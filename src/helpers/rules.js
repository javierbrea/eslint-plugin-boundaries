const chalk = require("chalk");

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

function capturesMatch(captures, capturesToMatch) {
  return Object.keys(captures).reduce((match, key) => {
    if (!capturesToMatch[key] !== captures[key]) {
      return false;
    }
    return true;
  }, true);
}

function ruleMatchElementType(elementsTypesMatchers, elementInfo) {
  let match = false;
  const matchers = !Array.isArray(elementsTypesMatchers)
    ? [elementsTypesMatchers]
    : elementsTypesMatchers;
  matchers.forEach((matcher) => {
    if (!match) {
      if (Array.isArray(matcher)) {
        const [type, captures] = matcher;
        if (elementInfo.type === type && capturesMatch(captures, elementInfo.capturedValues)) {
          match = true;
        }
      } else {
        if (elementInfo.type === matcher) {
          match = true;
        }
      }
    }
  });
  return match;
}

function getElementRules(elementInfo, options) {
  if (!options.rules) {
    return [];
  }
  return options.rules.filter((rule) => {
    return ruleMatchElementType(rule.from, elementInfo);
  });
}

function elementRulesAllow({ element, dependency, options, ruleMatcher }) {
  return getElementRules(element, options).reduce((allowed, rule) => {
    if (rule.disallow && ruleMatcher(rule.disallow, dependency)) {
      return false;
    }
    if (rule.allow && ruleMatcher(rule.allow, dependency)) {
      return true;
    }
    return allowed;
  }, options.default === "allow");
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
  getElementRules,
  ruleMatchElementType,
  elementRulesAllow,
};
