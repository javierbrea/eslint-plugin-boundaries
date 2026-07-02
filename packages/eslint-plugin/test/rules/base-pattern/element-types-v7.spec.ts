import ruleFactory from "../../../src/Rules/Dependencies";
import { ELEMENT_TYPES as RULE } from "../../../src/Shared";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";

const settings = SETTINGS.basePatternV7;

const rule = ruleFactory();

const { absoluteFilePath } = pathResolvers("base-pattern");

const options = [
  {
    default: "disallow",
    policies: [
      {
        from: {
          element: { type: "modules", captured: { domain: "domain-a" } },
        },
        allow: {
          to: [
            {
              element: {
                type: "modules",
                captured: { domain: "{{ domain }}" },
              },
            },
            {
              element: {
                type: "components",
                captured: { domain: "{{ domain }}" },
              },
            },
          ],
        },
      },
      {
        from: {
          element: { type: "modules", captured: { domain: "domain-b" } },
        },
        allow: {
          to: [
            { element: { type: "modules" } },
            { element: { type: "components" } },
          ],
        },
      },
      {
        from: {
          element: { type: "components", captured: { domain: "domain-a" } },
        },
        allow: {
          to: {
            element: { type: "components", captured: { domain: "domain-a" } },
          },
        },
      },
      {
        from: {
          element: { type: "components", captured: { domain: "domain-b" } },
        },
        allow: { to: { element: { type: "components" } } },
      },
    ],
  },
];

const ruleTester = createRuleTester(settings);

ruleTester.run(RULE, rule, {
  valid: [
    // module from domain a can import module from domain a
    {
      filename: absoluteFilePath(
        "domains/domain-a/modules/module-a/ModuleA.js"
      ),
      code: "import ModuleB from 'domains/domain-a/modules/module-b'",
      options,
    },
    // module from domain a can import module from domain a
    {
      filename: absoluteFilePath(
        "domains/domain-a/modules/module-b/ModuleB.js"
      ),
      code: "import ModuleB from 'domains/domain-a/modules/module-a'",
      options,
    },
    // private module from domain a can import module from domain a
    {
      filename: absoluteFilePath(
        "domains/domain-a/modules/module-b/modules/module-h/ModuleH.js"
      ),
      code: "import ModuleB from 'domains/domain-a/modules/module-a'",
      options,
    },
    // module from domain a can import component from domain a
    {
      filename: absoluteFilePath(
        "domains/domain-a/modules/module-a/ModuleA.js"
      ),
      code: "import ComponentA from 'domains/domain-a/components/atoms/atom-a'",
      options,
    },
    // module from domain b can import module from domain b
    {
      filename: absoluteFilePath(
        "domains/domain-b/modules/module-c/ModuleC.js"
      ),
      code: "import ModuleB from 'domains/domain-b/modules/module-d'",
      options,
    },
    // module from domain b can import module from domain a
    {
      filename: absoluteFilePath(
        "domains/domain-b/modules/module-c/ModuleC.js"
      ),
      code: "import ModuleB from 'domains/domain-a/modules/module-b'",
      options,
    },
    // module from domain b can import component from domain b
    {
      filename: absoluteFilePath(
        "domains/domain-b/modules/module-d/ModuleD.js"
      ),
      code: "import ComponentA from 'domains/domain-b/components/atoms/atom-c'",
      options,
    },
    // module from domain b can import component from domain a
    {
      filename: absoluteFilePath(
        "domains/domain-b/modules/module-d/ModuleD.js"
      ),
      code: "import ComponentA from 'domains/domain-a/components/atoms/atom-a'",
      options,
    },
    // private module from domain b can import component from domain b
    {
      filename: absoluteFilePath(
        "domains/domain-b/modules/module-d/modules/module-e/modules/module-g/ModuleG.js"
      ),
      code: "import ComponentA from 'domains/domain-b/components/molecules/molecule-c'",
      options,
    },
    // private module from domain b can import component from domain a
    {
      filename: absoluteFilePath(
        "domains/domain-b/modules/module-d/modules/module-e/modules/module-g/ModuleG.js"
      ),
      code: "import ComponentA from 'domains/domain-a/components/atoms/atom-a'",
      options,
    },
    // component from domain a can import component from domain a
    {
      filename: absoluteFilePath(
        "domains/domain-a/components/atoms/atom-a/AtomA.js"
      ),
      code: "import ComponentA from 'domains/domain-a/components/molecules/molecule-a/MoleculeA.js'",
      options,
    },
    // private component from domain a can import component from domain a
    {
      filename: absoluteFilePath(
        "domains/domain-a/modules/module-a/components/atoms/atom-e/AtomE.js"
      ),
      code: "import ComponentA from 'domains/domain-a/components/molecules/molecule-a/MoleculeA.js'",
      options,
    },
    // component from domain b can import component from domain b
    {
      filename: absoluteFilePath(
        "domains/domain-b/components/atoms/atom-c/AtomC.js"
      ),
      code: "import ComponentA from 'domains/domain-b/components/atoms/atom-d/AtomD.js'",
      options,
    },
    // component from domain b can import component from domain a
    {
      filename: absoluteFilePath(
        "domains/domain-b/components/atoms/atom-c/AtomC.js"
      ),
      code: "import ComponentA from 'domains/domain-a/components/molecules/molecule-a/MoleculeA.js'",
      options,
    },
  ],
  invalid: [
    // module from domain a can't import module from domain b
    {
      filename: absoluteFilePath(
        "domains/domain-a/modules/module-a/ModuleA.js"
      ),
      code: "import ModuleC from 'domains/domain-b/modules/module-c'",
      options,
      errors: [
        {
          message:
            'There is no policy allowing dependencies from elements of type "modules" and captured values: parentFolders="test/fixtures/base-pattern", domain="domain-a", elementName="module-a" to elements of type "modules" and captured values: parentFolders="test/fixtures/base-pattern", domain="domain-b", elementName="module-c"',
          type: "Literal",
        },
      ],
    },
    // private module from domain a can't import module from domain b
    {
      filename: absoluteFilePath(
        "domains/domain-a/modules/module-b/modules/module-h/ModuleH.js"
      ),
      code: "import ModuleB from 'domains/domain-b/modules/module-c'",
      options,
      errors: [
        {
          message:
            'There is no policy allowing dependencies from elements of type "modules" and captured values: parentFolders="test/fixtures/base-pattern", domain="domain-a", elementName="module-h" to elements of type "modules" and captured values: parentFolders="test/fixtures/base-pattern", domain="domain-b", elementName="module-c"',
          type: "Literal",
        },
      ],
    },
    // module from domain a can't import component from domain b
    {
      filename: absoluteFilePath(
        "domains/domain-a/modules/module-a/ModuleA.js"
      ),
      code: "import ComponentC from 'domains/domain-b/components/atoms/atom-c'",
      options,
      errors: [
        {
          message:
            'There is no policy allowing dependencies from elements of type "modules" and captured values: parentFolders="test/fixtures/base-pattern", domain="domain-a", elementName="module-a" to elements of type "components" and captured values: parentFolders="test/fixtures/base-pattern", domain="domain-b", type="atoms", elementName="atom-c"',
          type: "Literal",
        },
      ],
    },
    // component from domain a can't import module from domain a
    {
      filename: absoluteFilePath(
        "domains/domain-a/components/molecules/molecule-a/MoleculeA.js"
      ),
      code: "import ModuleA from 'domains/domain-a/modules/module-a'",
      options,
      errors: [
        {
          message:
            'There is no policy allowing dependencies from elements of type "components" and captured values: parentFolders="test/fixtures/base-pattern", domain="domain-a", type="molecules", elementName="molecule-a" to elements of type "modules" and captured values: parentFolders="test/fixtures/base-pattern", domain="domain-a", elementName="module-a"',
          type: "Literal",
        },
      ],
    },
    // component from domain a can't import module from domain b
    {
      filename: absoluteFilePath(
        "domains/domain-a/components/molecules/molecule-a/MoleculeA.js"
      ),
      code: "import ModuleC from 'domains/domain-b/modules/module-c'",
      options,
      errors: [
        {
          message:
            'There is no policy allowing dependencies from elements of type "components" and captured values: parentFolders="test/fixtures/base-pattern", domain="domain-a", type="molecules", elementName="molecule-a" to elements of type "modules" and captured values: parentFolders="test/fixtures/base-pattern", domain="domain-b", elementName="module-c"',
          type: "Literal",
        },
      ],
    },
    // component from domain a can't import component from domain b
    {
      filename: absoluteFilePath(
        "domains/domain-a/components/molecules/molecule-a/MoleculeA.js"
      ),
      code: "import ComponentC from 'domains/domain-b/components/atoms/atom-c'",
      options,
      errors: [
        {
          message:
            'There is no policy allowing dependencies from elements of type "components" and captured values: parentFolders="test/fixtures/base-pattern", domain="domain-a", type="molecules", elementName="molecule-a" to elements of type "components" and captured values: parentFolders="test/fixtures/base-pattern", domain="domain-b", type="atoms", elementName="atom-c"',
          type: "Literal",
        },
      ],
    },
    // private component from domain a can't import component from domain b
    {
      filename: absoluteFilePath(
        "domains/domain-a/modules/module-a/components/molecules/molecule-e/MoleculeE.js"
      ),
      code: "import ComponentC from 'domains/domain-b/components/atoms/atom-c'",
      options,
      errors: [
        {
          message:
            'There is no policy allowing dependencies from elements of type "components" and captured values: parentFolders="test/fixtures/base-pattern", domain="domain-a", type="molecules", elementName="molecule-e" to elements of type "components" and captured values: parentFolders="test/fixtures/base-pattern", domain="domain-b", type="atoms", elementName="atom-c"',
          type: "Literal",
        },
      ],
    },
    // component from domain b can't import module from domain b
    {
      filename: absoluteFilePath(
        "domains/domain-b/components/molecules/molecule-c/MoleculeC.js"
      ),
      code: "import ModuleC from 'domains/domain-b/modules/module-c'",
      options,
      errors: [
        {
          message:
            'There is no policy allowing dependencies from elements of type "components" and captured values: parentFolders="test/fixtures/base-pattern", domain="domain-b", type="molecules", elementName="molecule-c" to elements of type "modules" and captured values: parentFolders="test/fixtures/base-pattern", domain="domain-b", elementName="module-c"',
          type: "Literal",
        },
      ],
    },
    // component from domain b can't import module from domain a
    {
      filename: absoluteFilePath(
        "domains/domain-b/components/molecules/molecule-c/MoleculeC.js"
      ),
      code: "import ModuleC from 'domains/domain-a/modules/module-a'",
      options,
      errors: [
        {
          message:
            'There is no policy allowing dependencies from elements of type "components" and captured values: parentFolders="test/fixtures/base-pattern", domain="domain-b", type="molecules", elementName="molecule-c" to elements of type "modules" and captured values: parentFolders="test/fixtures/base-pattern", domain="domain-a", elementName="module-a"',
          type: "Literal",
        },
      ],
    },
  ],
});
