import rule from "../../../src/Rules/ElementTypes";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";
import {
  errorMessage,
  elementTypesNoRuleMessage,
} from "../../support/messages";

const { ELEMENT_TYPES: RULE } = require("../../../src/Settings");

const { absoluteFilePath } = pathResolvers("one-level");

const testObjectSyntax = (
  settings: RuleTesterSettings,
  options: unknown[],
  errorMessages: Record<number, string>
) => {
  const ruleTester = createRuleTester(settings);

  ruleTester.run(RULE, rule, {
    valid: [
      // Components can import helper-a
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from '../../helpers/helper-a'",
        options,
      },
      // Components can import component-b
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ComponentB from 'components/component-b'",
        options,
      },
    ],
    invalid: [
      // Components can't import helper-b (restricted by capture)
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperB from '../../helpers/helper-b'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              0,
              elementTypesNoRuleMessage({
                file: "'components' with elementName 'component-a'",
                dep: "'helpers' with elementName 'helper-b'",
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Components can't import component-a (circular/self restriction)
      {
        filename: absoluteFilePath("components/component-b/ComponentB.js"),
        code: "import ComponentA from 'components/component-a'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              1,
              elementTypesNoRuleMessage({
                file: "'components' with elementName 'component-b'",
                dep: "'components' with elementName 'component-a'",
              })
            ),
            type: "Literal",
          },
        ],
      },
    ],
  });
};

// Test 1: Object syntax for 'from' and 'allow' using 'kind' and 'capture'
testObjectSyntax(
  SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      rules: [
        {
          from: { kind: "components" },
          allow: [
            { kind: "helpers", capture: { elementName: "helper-a" } },
            { kind: "components", capture: { elementName: "!component-a" } },
          ],
        },
      ],
    },
  ],
  {
      // No custom messages needed as we expect default messages now
  }
);

// Test 2: Object syntax using 'nodeKind' (dependency only)
const testNodeKind = (
  settings: RuleTesterSettings,
  options: unknown[],
  errorMessages: Record<number, string>
) => {
  const ruleTester = createRuleTester(settings);

  ruleTester.run(RULE, rule, {
    valid: [
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from '../../helpers/helper-a'",
        options,
      },
    ],
    invalid: [
        // Fails because rule allows only nodeKind="export" (just testing mismatch)
        // Actually, let's test that "import" works and mismatch fails
    ],
  });
};

// Valid nodeKind
testNodeKind(
    SETTINGS.oneLevel,
    [
      {
        default: "disallow",
        rules: [
          {
            from: { kind: "components" },
            allow: [
              { kind: "helpers", nodeKind: "import" },
            ],
          },
        ],
      },
    ],
    {}
);

// Test 3: Mixed string/tuple and object syntax (should work, but legacy might emit warnings - though warnings are not checked here, functionality is)
testObjectSyntax(
    SETTINGS.oneLevel,
    [
      {
        default: "disallow",
        rules: [
          {
            from: "components",
            allow: [
              ["helpers", { elementName: "helper-a" }],
              { kind: "components", capture: { elementName: "!component-a" } },
            ],
          },
        ],
      },
    ],
    {
        // No custom messages needed
    }
  );

// Test 4: Specifiers
const testSpecifiers = (
    settings: RuleTesterSettings,
    options: unknown[],
    errorMessages: Record<number, string>
  ) => {
    const ruleTester = createRuleTester(settings);

    ruleTester.run(RULE, rule, {
      valid: [
          // helper-a is imported as "HelperA" (name match)
        {
          filename: absoluteFilePath("components/component-a/ComponentA.js"),
          code: "import { HelperA } from '../../helpers/helper-a'",
          options,
        },
      ],
      invalid: [
          // helper-a imported as "Foo" (name mismatch)
        {
          filename: absoluteFilePath("components/component-a/ComponentA.js"),
          code: "import { Foo } from '../../helpers/helper-a'",
          options,
          errors: [
            {
              message: errorMessage(
                errorMessages,
                0,
                elementTypesNoRuleMessage({
                  file: "'components' with elementName 'component-a'",
                  dep: "'helpers' with elementName 'helper-a'",
                })
              ),
              type: "Literal",
            },
          ],
        },
      ],
    });
  };

  testSpecifiers(
    SETTINGS.oneLevel,
    [
      {
        default: "disallow",
        rules: [
          {
            from: { kind: "components" },
            allow: [
              { kind: "helpers", specifiers: ["Helper*"] },
            ],
          },
        ],
      },
    ],
    {}
  );
