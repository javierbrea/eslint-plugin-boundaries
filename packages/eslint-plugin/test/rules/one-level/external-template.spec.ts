import rule from "../../../src/Rules/External";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";
import { errorMessage, externalNoRuleMessage } from "../../support/messages";

const { EXTERNAL: RULE } = require("../../../src/Settings");

const { absoluteFilePath } = pathResolvers("one-level");

const runTest = (
  settings: RuleTesterSettings,
  options: unknown[],
  errorMessages: Record<number, string>
) => {
  const ruleTester = createRuleTester(settings);
  ruleTester.run(RULE, rule, {
    valid: [
      // Module-a can import @module-helpers/module-a
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import { Icon } from '@module-helpers/module-a'",
        options,
      },
      // ModuleC can import moduleC from @module-helpers/all
      {
        filename: absoluteFilePath("modules/ModuleC/ModuleC.js"),
        code: "import { ModuleC } from '@module-helpers/all'",
        options,
      },
    ],
    invalid: [
      // Module-a can`t import @module-helpers/module-b
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ModuleBHelpers from '@module-helpers/module-b'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              0,
              externalNoRuleMessage({
                file: "'modules' with elementName 'module-a'",
                dep: "@module-helpers/module-b",
              })
            ),
            type: "Literal",
          },
        ],
      },
      // ModuleC can`t import specifier different to ModuleC from @module-helpers/all
      {
        filename: absoluteFilePath("modules/ModuleC/ModuleC.js"),
        code: "import { Foo } from '@module-helpers/all'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              1,
              externalNoRuleMessage({
                file: "'modules' with elementName 'ModuleC'",
                dep: "@module-helpers/all",
              })
            ),
            type: "Literal",
          },
        ],
      },
    ],
  });
};

// disallow-based options

runTest(
  SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      rules: [
        {
          from: [["modules", { elementName: "module-a" }]],
          allow: ["@module-helpers/${from.elementName}"],
        },
        {
          from: [["modules", { elementName: "ModuleC" }]],
          allow: [
            ["@module-helpers/all", { specifiers: ["${from.elementName}"] }],
          ],
        },
      ],
    },
  ],
  {}
);
