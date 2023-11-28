const { EXTERNAL: RULE } = require("../../../src/constants/rules");
const {
  SETTINGS,
  TYPESCRIPT_SETTINGS,
  createRuleTester,
  pathResolvers,
} = require("../../support/helpers");

const rule = require(`../../../src/rules/${RULE}`);

const { absoluteFilePath } = pathResolvers("one-level");

const settings = {
  ...SETTINGS.oneLevel,
  "boundaries/dependency-nodes": ["import"],
  parserOptions: {
    // Due to dynamic import usage
    ecmaVersion: 2020,
    sourceType: "module",
  },
};
const typescriptSettings = {
  ...TYPESCRIPT_SETTINGS.oneLevel,
  "boundaries/dependency-nodes": ["import"],
};
const dependencyNodesSettings = {
  "boundaries/dependency-nodes": ["import", "export", "dynamic-import"],
  "boundaries/additional-dependency-nodes": [
    {
      // mock('source')
      selector: "CallExpression[callee.name=mock] > Literal",
    },
  ],
};

const options = [
  {
    default: "allow",
    rules: [
      // Components can't import Link type from react-router-dom
      {
        from: "components",
        disallow: [["react-router-dom", { specifiers: ["Link"] }]],
        importKind: "type",
      },
      // Modules can't import Link value from react-router-dom
      {
        from: "modules",
        disallow: [["react-router-dom", { specifiers: ["Link"] }]],
        importKind: "value",
      },
      // Modules can't import react
      {
        from: "modules",
        disallow: ["react"],
        importKind: "*",
      },
    ],
  },
];

// Without redefined dependency nodes
createRuleTester(settings).run(RULE, rule, {
  valid: [
    // Modules can export Link value from react-router-dom
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "export { Link } from 'react-router-dom'",
      options,
      errors: [
        {
          type: "Literal",
        },
      ],
    },
  ],
  invalid: [
    // Modules can't import Link value from react-router-dom
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "import { Link } from 'react-router-dom'",
      options,
      errors: [
        {
          type: "Literal",
        },
      ],
    },
  ],
});

// With redefined dependency nodes
createRuleTester({
  ...settings,
  ...dependencyNodesSettings,
}).run(RULE, rule, {
  valid: [
    // Components can export Link value from react-router-dom
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "export { Link } from 'react-router-dom'",
      options,
    },
    // Components can export all from react-router-dom (ignoring specifiers)
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "export * from 'react-router-dom'",
      options,
    },
    // Components can dynamically import react
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "import('react')",
      options,
    },
    // Components can mock react
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "mock('react')",
      options,
    },
    // Modules can export all from react-router-dom (ignoring specifiers)
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "export * from 'react-router-dom'",
      options,
    },
  ],
  invalid: [
    // Modules can't export Link value from react-router-dom
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "export { Link } from 'react-router-dom'",
      options,
      errors: [
        {
          type: "Literal",
        },
      ],
    },
    // Modules can't export a value from react
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "export { useState } from 'react'",
      options,
      errors: [
        {
          type: "Literal",
        },
      ],
    },
    // Modules can't export all from react
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "export * from 'react'",
      options,
      errors: [
        {
          type: "Literal",
        },
      ],
    },
    // Modules can't dynamically import react
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "import('react')",
      options,
      errors: [
        {
          type: "Literal",
        },
      ],
    },
    // Modules can't mock react
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "mock('react')",
      options,
      errors: [
        {
          type: "Literal",
        },
      ],
    },
  ],
});

// Typescript without redefined dependency nodes
createRuleTester(typescriptSettings).run(RULE, rule, {
  valid: [
    // Components can export Link type from react-router-dom
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "export type { Link } from 'react-router-dom'",
      options,
    },
    // Modules can export Link value from react-router-dom
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "export { Link } from 'react-router-dom'",
      options,
      errors: [
        {
          type: "Literal",
        },
      ],
    },
  ],
  invalid: [
    // Components can't import Link type from react-router-dom
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "import type { Link } from 'react-router-dom'",
      options,
      errors: [
        {
          type: "Literal",
        },
      ],
    },
    // Modules can't import Link value from react-router-dom
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "import { Link } from 'react-router-dom'",
      options,
      errors: [
        {
          type: "Literal",
        },
      ],
    },
  ],
});

// Typescript with redefined dependency nodes
createRuleTester({
  ...typescriptSettings,
  ...dependencyNodesSettings,
}).run(RULE, rule, {
  valid: [
    // Components can export Link value from react-router-dom
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "export { Link } from 'react-router-dom'",
      options,
    },
    // Components can export all from react-router-dom (ignoring specifiers)
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "export * from 'react-router-dom'",
      options,
    },
    // Components can dynamically import react
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "import('react')",
      options,
    },
    // Components can mock react
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "mock('react')",
      options,
    },
    // Modules can export Link type from react-router-dom
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "export type { Link } from 'react-router-dom'",
      options,
    },
    // Modules can export all from react-router-dom (ignoring specifiers)
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "export * from 'react-router-dom'",
      options,
    },
  ],
  invalid: [
    // Components can't export Link type from react-router-dom
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "export type { Link } from 'react-router-dom'",
      options,
      errors: [
        {
          type: "Literal",
        },
      ],
    },
    // Modules can't export Link value from react-router-dom
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "export { Link } from 'react-router-dom'",
      options,
      errors: [
        {
          type: "Literal",
        },
      ],
    },
    // Modules can't export a value from react
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "export { useState } from 'react'",
      options,
      errors: [
        {
          type: "Literal",
        },
      ],
    },
    // Modules can't export a type from react
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "export type { ComponentProps } from 'react'",
      options,
      errors: [
        {
          type: "Literal",
        },
      ],
    },
    // Modules can't export all from react
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "export * from 'react'",
      options,
      errors: [
        {
          type: "Literal",
        },
      ],
    },
    // Modules can't dynamically import react
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "import('react')",
      options,
      errors: [
        {
          type: "Literal",
        },
      ],
    },
    // Modules can't mock react
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "mock('react')",
      options,
      errors: [
        {
          type: "Literal",
        },
      ],
    },
  ],
});
