const { ELEMENT_TYPES: RULE } = require("../../../src/constants/rules");
const { SETTINGS, createRuleTester, pathResolvers } = require("../../support/helpers");

const rule = require(`../../../src/rules/${RULE}`);

const { absoluteFilePath, codeFilePath } = pathResolvers("one-level");

const errorMessage = (fileType, dependencyType) =>
  `Usage of '${dependencyType}' is not allowed in '${fileType}'`;

const test = (settings, options) => {
  const ruleTester = createRuleTester(settings);

  ruleTester.run(RULE, rule, {
    valid: [
      // Non recognized types can import whatever
      {
        filename: absoluteFilePath("foo/index.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options,
      },
      // Components can import helpers
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from '../../helpers/helper-a'",
        options,
      },
      // Components can import helpers using alias
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options,
      },
      // Components can import components using alias
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ComponentB from 'components/component-b'",
        options,
      },
      // Modules can import helpers using alias
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options,
      },
      // Modules can import any helpers file using alias
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import HelperA from 'helpers/helper-a/HelperA.js'",
        options,
      },
      // Modules can import components using alias
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ComponentA from 'components/component-a'",
        options,
      },
      // Modules can import other not recognized types when alias is not set
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ComponentA from 'components/component-a'",
        options,
        settings: {
          ...settings,
          "boundaries/alias": null,
        },
      },
      // Can import internal files
      {
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "import ModuleB from './ModuleA'",
        options,
      },
      // Modules can import modules
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ModuleB from '../module-b'",
        options,
      },
      // Modules can import non existant modules files
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ModuleB from '../../modules/module-b/foo.js'",
        options,
      },
      // Helpers can import ignored helpers
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options,
        settings: {
          ...settings,
          "boundaries/ignore": [codeFilePath("helpers/helper-b/**/*.js")],
        },
      },
      // Helpers can import ignored helpers using micromatch
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options,
        settings: {
          ...settings,
          "boundaries/ignore": ["**/helpers/helper-b/**/*"],
        },
      },
      // Invalid options
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ModuleB from '../module-b/foo.js'",
        options: [{ rules: undefined }],
      },
      // Invalid options
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ModuleB from '../module-b/foo.js'",
        options: [
          {
            rules: [
              {
                from: "foo",
                allow: ["components"],
              },
            ],
          },
        ],
      },
      // Invalid options
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ModuleB from '../../modules/module-b/foo.js'",
        options: [
          {
            rules: [
              {
                from: "components",
                disallow: ["foo"],
              },
            ],
          },
        ],
      },
      // No types provided in settings
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ModuleB from '../../modules/module-b/foo.js'",
        settings: {
          ...settings,
          "boundaries/types": null,
        },
      },
      // Repeat no type provided, check that it continues working
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ModuleB from '../../modules/module-b/foo.js'",
        settings: {
          ...settings,
          "boundaries/types": null,
        },
      },
      // Helpers cant import another helper if everything is allowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
          },
        ],
      },
    ],
    invalid: [
      // Helpers can't import another if everything is disallowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
          },
        ],
        errors: [
          {
            message: errorMessage("helpers", "helpers"),
            type: "ImportDeclaration",
          },
        ],
      },
      // Helpers can't import another helper
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options,
        errors: [
          {
            message: errorMessage("helpers", "helpers"),
            type: "ImportDeclaration",
          },
        ],
      },
      // Helpers can't import a component:
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import ComponentA from 'components/component-a'",
        options,
        errors: [
          {
            message: errorMessage("helpers", "components"),
            type: "ImportDeclaration",
          },
        ],
      },
      // Helpers can't import a module:
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import ModuleA from 'modules/module-a'",
        options,
        errors: [
          {
            message: errorMessage("helpers", "modules"),
            type: "ImportDeclaration",
          },
        ],
      },
      // Components can't import a module:
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ModuleA from 'modules/module-a'",
        options,
        errors: [
          {
            message: errorMessage("components", "modules"),
            type: "ImportDeclaration",
          },
        ],
      },
    ],
  });
};

const testCapture = (settings, options) => {
  const ruleTester = createRuleTester(settings);

  ruleTester.run(RULE, rule, {
    valid: [
      // Components can import helper-a
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from '../../helpers/helper-a'",
        options,
      },
      // Components can import helper-a using alias
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options,
      },
      // Components can import component-b using alias
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ComponentB from 'components/component-b'",
        options,
      },
      // Component A can import internal files
      {
        filename: absoluteFilePath("components/component-a/index.js"),
        code: "import ComponentA from './ComponentA'",
        options,
      },
      // Modules can import helper-a using alias
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options,
      },
    ],
    invalid: [
      // Components can't import helper-b
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperB from '../../helpers/helper-b'",
        options,
        errors: [
          {
            message: errorMessage("components", "helpers"),
            type: "ImportDeclaration",
          },
        ],
      },
      // Components can't import helper-b using alias
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-b'",
        options,
        errors: [
          {
            message: errorMessage("components", "helpers"),
            type: "ImportDeclaration",
          },
        ],
      },
      // Components can't import component-a
      {
        filename: absoluteFilePath("components/component-b/ComponentB.js"),
        code: "import ComponentB from 'components/component-a'",
        options,
        errors: [
          {
            message: errorMessage("components", "components"),
            type: "ImportDeclaration",
          },
        ],
      },
      // Modules can't import helper-b
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options,
        errors: [
          {
            message: errorMessage("modules", "helpers"),
            type: "ImportDeclaration",
          },
        ],
      },
    ],
  });
};

// deprecated settings

test(SETTINGS.deprecated, [
  {
    default: "disallow",
    rules: [
      {
        from: "components",
        allow: ["helpers", "components"],
      },
      {
        from: "modules",
        allow: ["helpers", "components", "modules"],
      },
    ],
  },
]);

// settings with no capture option
test(
  {
    ...SETTINGS.oneLevel,
    "boundaries/elements": [
      {
        type: "helpers",
        pattern: "helpers/*",
      },
      {
        type: "components",
        pattern: "components/*",
      },
      {
        type: "modules",
        pattern: "modules/*",
      },
    ],
  },
  [
    {
      default: "allow",
      rules: [
        {
          from: "helpers",
          disallow: ["modules", "components", "helpers"],
        },
        {
          from: "components",
          disallow: ["modules"],
        },
      ],
    },
  ]
);

// disallow-based options

test(SETTINGS.oneLevel, [
  {
    default: "disallow",
    rules: [
      {
        from: "components",
        allow: ["helpers", "components"],
      },
      {
        from: "modules",
        allow: ["helpers", "components", "modules"],
      },
    ],
  },
]);

// micromatch-based options

test(SETTINGS.oneLevel, [
  {
    default: "disallow",
    rules: [
      {
        from: "c*",
        allow: ["h*", "c*"],
      },
      {
        from: "m*",
        allow: ["h*", "c*", "m*"],
      },
    ],
  },
]);

// allow-based options
test(SETTINGS.oneLevel, [
  {
    default: "allow",
    rules: [
      {
        from: "helpers",
        disallow: ["modules", "components", "helpers"],
      },
      {
        from: "components",
        disallow: ["modules"],
      },
    ],
  },
]);

// capture options

testCapture(SETTINGS.oneLevel, [
  {
    default: "disallow",
    rules: [
      {
        from: "components",
        allow: [["helpers", { elementName: "helper-a" }], "components"],
        disallow: [["components", { elementName: "component-a" }]],
      },
      {
        from: "modules",
        allow: [["helpers", { elementName: "helper-a" }], "components", "modules"],
      },
    ],
  },
]);

// capture options with micromatch negative expression

testCapture(SETTINGS.oneLevel, [
  {
    default: "disallow",
    rules: [
      {
        from: "components",
        allow: [
          ["helpers", { elementName: "helper-a" }],
          ["components", { elementName: "!component-a" }],
        ],
      },
      {
        from: "modules",
        allow: [["helpers", { elementName: "helper-a" }], "components", "modules"],
      },
    ],
  },
]);

// capture options with micromatch

testCapture(SETTINGS.oneLevel, [
  {
    default: "disallow",
    rules: [
      {
        from: "c*",
        allow: [["helpers", { elementName: "*-a" }], "c*"],
        disallow: [["c*", { elementName: "*-a" }]],
      },
      {
        from: "modules",
        allow: [["h*", { elementName: "*-a" }], "c*", "m*"],
      },
    ],
  },
]);
