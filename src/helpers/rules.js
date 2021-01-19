const chalk = require("chalk");

const { TYPES } = require("../constants/settings");
const { PLUGIN_NAME } = require("../constants/plugin");
const { getElementInfo } = require("./elements");

const warns = [];

const warn = (message) => {
  if (!warns.includes(message)) {
    console.warn(chalk.yellow(`[${PLUGIN_NAME}]: ${message}`));
    warns.push(message);
  }
};

const validateSettings = (context) => {
  if (!context.settings[TYPES] || !context.settings[TYPES].length) {
    warn(`Please provide element types using the '${TYPES}' setting`);
  }
};

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
};
