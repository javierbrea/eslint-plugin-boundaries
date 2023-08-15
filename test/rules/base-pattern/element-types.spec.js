const { ELEMENT_TYPES: RULE } = require("../../../src/constants/rules");
const { SETTINGS, createRuleTester, pathResolvers } = require("../../support/helpers");
const { elementTypesNoRuleMessage } = require("../../support/messages");

const rule = require(`../../../src/rules/${RULE}`);

const settings = SETTINGS.basePattern;

const { absoluteFilePath } = pathResolvers("base-pattern");

const options = [
  {
    default: "disallow",
    rules: [
      {
        from: [["modules", { domain: "domain-a" }]],
        allow: [
          ["modules", { domain: "${domain}" }],
          ["components", { domain: "${domain}" }],
        ],
      },
      {
        from: [["modules", { domain: "domain-b" }]],
        allow: ["modules", "components"],
      },
      {
        from: [["components", { domain: "domain-a" }]],
        allow: [["components", { domain: "domain-a" }]],
      },
      {
        from: [["components", { domain: "domain-b" }]],
        allow: ["components"],
      },
    ],
  },
];

const ruleTester = createRuleTester(settings);

ruleTester.run(RULE, rule, {
  valid: [
    // module from domain a can import module from domain a
    {
      filename: absoluteFilePath("domains/domain-a/modules/module-a/ModuleA.js"),
      code: "import ModuleB from 'domains/domain-a/modules/module-b'",
      options,
    },
    // module from domain a can import module from domain a
    {
      filename: absoluteFilePath("domains/domain-a/modules/module-b/ModuleB.js"),
      code: "import ModuleB from 'domains/domain-a/modules/module-a'",
      options,
    },
    // private module from domain a can import module from domain a
    {
      filename: absoluteFilePath("domains/domain-a/modules/module-b/modules/module-h/ModuleH.js"),
      code: "import ModuleB from 'domains/domain-a/modules/module-a'",
      options,
    },
    // module from domain a can import component from domain a
    {
      filename: absoluteFilePath("domains/domain-a/modules/module-a/ModuleA.js"),
      code: "import ComponentA from 'domains/domain-a/components/atoms/atom-a'",
      options,
    },
    // module from domain b can import module from domain b
    {
      filename: absoluteFilePath("domains/domain-b/modules/module-c/ModuleC.js"),
      code: "import ModuleB from 'domains/domain-b/modules/module-d'",
      options,
    },
    // module from domain b can import module from domain a
    {
      filename: absoluteFilePath("domains/domain-b/modules/module-c/ModuleC.js"),
      code: "import ModuleB from 'domains/domain-a/modules/module-b'",
      options,
    },
    // module from domain b can import component from domain b
    {
      filename: absoluteFilePath("domains/domain-b/modules/module-d/ModuleD.js"),
      code: "import ComponentA from 'domains/domain-b/components/atoms/atom-c'",
      options,
    },
    // module from domain b can import component from domain a
    {
      filename: absoluteFilePath("domains/domain-b/modules/module-d/ModuleD.js"),
      code: "import ComponentA from 'domains/domain-a/components/atoms/atom-a'",
      options,
    },
    // private module from domain b can import component from domain b
    {
      filename: absoluteFilePath(
        "domains/domain-b/modules/module-d/modules/module-e/modules/module-g/ModuleG.js",
      ),
      code: "import ComponentA from 'domains/domain-b/components/molecules/molecule-c'",
      options,
    },
    // private module from domain b can import component from domain a
    {
      filename: absoluteFilePath(
        "domains/domain-b/modules/module-d/modules/module-e/modules/module-g/ModuleG.js",
      ),
      code: "import ComponentA from 'domains/domain-a/components/atoms/atom-a'",
      options,
    },
    // component from domain a can import component from domain a
    {
      filename: absoluteFilePath("domains/domain-a/components/atoms/atom-a/AtomA.js"),
      code: "import ComponentA from 'domains/domain-a/components/molecules/molecule-a/MoleculeA.js'",
      options,
    },
    // private component from domain a can import component from domain a
    {
      filename: absoluteFilePath(
        "domains/domain-a/modules/module-a/components/atoms/atom-e/AtomE.js",
      ),
      code: "import ComponentA from 'domains/domain-a/components/molecules/molecule-a/MoleculeA.js'",
      options,
    },
    // component from domain b can import component from domain b
    {
      filename: absoluteFilePath("domains/domain-b/components/atoms/atom-c/AtomC.js"),
      code: "import ComponentA from 'domains/domain-b/components/atoms/atom-d/AtomD.js'",
      options,
    },
    // component from domain b can import component from domain a
    {
      filename: absoluteFilePath("domains/domain-b/components/atoms/atom-c/AtomC.js"),
      code: "import ComponentA from 'domains/domain-a/components/molecules/molecule-a/MoleculeA.js'",
      options,
    },
  ],
  invalid: [
    // module from domain a can't import module from domain b
    {
      filename: absoluteFilePath("domains/domain-a/modules/module-a/ModuleA.js"),
      code: "import ModuleC from 'domains/domain-b/modules/module-c'",
      options,
      errors: [
        {
          message: elementTypesNoRuleMessage({
            file: "'modules' with parentFolders 'test/fixtures/base-pattern', domain 'domain-a' and elementName 'module-a'",
            dep: "'modules' with parentFolders 'test/fixtures/base-pattern', domain 'domain-b' and elementName 'module-c'",
          }),
          type: "ImportDeclaration",
        },
      ],
    },
    // private module from domain a can't import module from domain b
    {
      filename: absoluteFilePath("domains/domain-a/modules/module-b/modules/module-h/ModuleH.js"),
      code: "import ModuleB from 'domains/domain-b/modules/module-c'",
      options,
      errors: [
        {
          message: elementTypesNoRuleMessage({
            file: "'modules' with parentFolders 'test/fixtures/base-pattern', domain 'domain-a' and elementName 'module-h'",
            dep: "'modules' with parentFolders 'test/fixtures/base-pattern', domain 'domain-b' and elementName 'module-c'",
          }),
          type: "ImportDeclaration",
        },
      ],
    },
    // module from domain a can't import component from domain b
    {
      filename: absoluteFilePath("domains/domain-a/modules/module-a/ModuleA.js"),
      code: "import ComponentC from 'domains/domain-b/components/atoms/atom-c'",
      options,
      errors: [
        {
          message: elementTypesNoRuleMessage({
            file: "'modules' with parentFolders 'test/fixtures/base-pattern', domain 'domain-a' and elementName 'module-a'",
            dep: "'components' with parentFolders 'test/fixtures/base-pattern', domain 'domain-b', type 'atoms' and elementName 'atom-c'",
          }),
          type: "ImportDeclaration",
        },
      ],
    },
    // component from domain a can't import module from domain a
    {
      filename: absoluteFilePath("domains/domain-a/components/molecules/molecule-a/MoleculeA.js"),
      code: "import ModuleA from 'domains/domain-a/modules/module-a'",
      options,
      errors: [
        {
          message: elementTypesNoRuleMessage({
            file: "'components' with parentFolders 'test/fixtures/base-pattern', domain 'domain-a', type 'molecules' and elementName 'molecule-a'",
            dep: "'modules' with parentFolders 'test/fixtures/base-pattern', domain 'domain-a' and elementName 'module-a'",
          }),
          type: "ImportDeclaration",
        },
      ],
    },
    // component from domain a can't import module from domain b
    {
      filename: absoluteFilePath("domains/domain-a/components/molecules/molecule-a/MoleculeA.js"),
      code: "import ModuleC from 'domains/domain-b/modules/module-c'",
      options,
      errors: [
        {
          message: elementTypesNoRuleMessage({
            file: "'components' with parentFolders 'test/fixtures/base-pattern', domain 'domain-a', type 'molecules' and elementName 'molecule-a'",
            dep: "'modules' with parentFolders 'test/fixtures/base-pattern', domain 'domain-b' and elementName 'module-c'",
          }),
          type: "ImportDeclaration",
        },
      ],
    },
    // component from domain a can't import component from domain b
    {
      filename: absoluteFilePath("domains/domain-a/components/molecules/molecule-a/MoleculeA.js"),
      code: "import ComponentC from 'domains/domain-b/components/atoms/atom-c'",
      options,
      errors: [
        {
          message: elementTypesNoRuleMessage({
            file: "'components' with parentFolders 'test/fixtures/base-pattern', domain 'domain-a', type 'molecules' and elementName 'molecule-a'",
            dep: "'components' with parentFolders 'test/fixtures/base-pattern', domain 'domain-b', type 'atoms' and elementName 'atom-c'",
          }),
          type: "ImportDeclaration",
        },
      ],
    },
    // private component from domain a can't import component from domain b
    {
      filename: absoluteFilePath(
        "domains/domain-a/modules/module-a/components/molecules/molecule-e/MoleculeE.js",
      ),
      code: "import ComponentC from 'domains/domain-b/components/atoms/atom-c'",
      options,
      errors: [
        {
          message: elementTypesNoRuleMessage({
            file: "'components' with parentFolders 'test/fixtures/base-pattern', domain 'domain-a', type 'molecules' and elementName 'molecule-e'",
            dep: "'components' with parentFolders 'test/fixtures/base-pattern', domain 'domain-b', type 'atoms' and elementName 'atom-c'",
          }),
          type: "ImportDeclaration",
        },
      ],
    },
    // component from domain b can't import module from domain b
    {
      filename: absoluteFilePath("domains/domain-b/components/molecules/molecule-c/MoleculeC.js"),
      code: "import ModuleC from 'domains/domain-b/modules/module-c'",
      options,
      errors: [
        {
          message: elementTypesNoRuleMessage({
            file: "'components' with parentFolders 'test/fixtures/base-pattern', domain 'domain-b', type 'molecules' and elementName 'molecule-c'",
            dep: "'modules' with parentFolders 'test/fixtures/base-pattern', domain 'domain-b' and elementName 'module-c'",
          }),
          type: "ImportDeclaration",
        },
      ],
    },
    // component from domain b can't import module from domain a
    {
      filename: absoluteFilePath("domains/domain-b/components/molecules/molecule-c/MoleculeC.js"),
      code: "import ModuleC from 'domains/domain-a/modules/module-a'",
      options,
      errors: [
        {
          message: elementTypesNoRuleMessage({
            file: "'components' with parentFolders 'test/fixtures/base-pattern', domain 'domain-b', type 'molecules' and elementName 'molecule-c'",
            dep: "'modules' with parentFolders 'test/fixtures/base-pattern', domain 'domain-a' and elementName 'module-a'",
          }),
          type: "ImportDeclaration",
        },
      ],
    },
  ],
});
