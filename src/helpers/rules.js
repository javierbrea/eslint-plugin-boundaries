const { TYPES } = require("../constants/settings");
const { PLUGIN_NAME } = require("../constants/plugin");

const warns = [];

const warn = (message) => {
  if (!warns.includes(message)) {
    console.warn(`[${PLUGIN_NAME}]: ${message}`);
    warns.push(message);
  }
};

const validateSettings = (context) => {
  if (!context.settings[TYPES].length) {
    warn(`Please provide element types using the '${TYPES}' setting`);
  }
};

const checkOptions = (context, property, ruleName, validate) => {
  const options = context.options;
  const settings = context.settings;
  const optionToCheck = options[0] && options[0][property];
  Object.keys(optionToCheck).forEach((type) => {
    if (!settings[TYPES].includes(type)) {
      warn(`Invalid element type '${type}' in '${ruleName}' rule config`);
    }
    if (!Array.isArray(optionToCheck[type])) {
      warn(
        `Invalid config in '${ruleName}' rule for '${type}' elements. Please provide an array of valid elements`
      );
    }
    optionToCheck[type].forEach((element) => {
      if (validate) {
        validate(type, element, context);
      }
    });
  });
};

const meta = (description, category, schema = []) => {
  return {
    meta: {
      type: "problem",
      docs: {
        description,
        category,
      },
      fixable: null,
      schema,
    },
  };
};

const dependencyLocation = (node, context) => {
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
};

module.exports = {
  checkOptions,
  meta,
  dependencyLocation,
  validateSettings,
  warn,
};
