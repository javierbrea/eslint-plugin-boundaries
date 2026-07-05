import ruleFactory from "../../../src/Rules/Dependencies";
import { ELEMENT_TYPES as RULE } from "../../../src/Shared";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";
import { errorMessage, externalNoRuleMessage } from "../../support/messages";

const rule = ruleFactory();
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
      checkAllOrigins: true,
      default: "disallow",
      policies: [
        {
          from: {
            element: { type: "modules", captured: { elementName: "module-a" } },
          },
          allow: [
            {
              to: {
                module: {
                  origin: "external",
                  source: "@module-helpers/{{ from.elementName }}",
                },
              },
            },
          ],
        },
        {
          from: {
            element: { type: "modules", captured: { elementName: "ModuleC" } },
          },
          allow: [
            {
              to: {
                module: { origin: "external", source: "@module-helpers/all" },
              },
              dependency: { specifiers: ["{{ from.elementName }}"] },
            },
          ],
        },
      ],
    },
  ],
  {
    0: 'There is no policy allowing dependencies from elements of type "modules" and captured values: elementName="module-a" to entities of module with origin "external" and module source "@module-helpers/module-b"',
    1: 'There is no policy allowing dependencies from elements of type "modules" and captured values: elementName="ModuleC" to entities of module with origin "external" and module source "@module-helpers/all"',
  }
);
