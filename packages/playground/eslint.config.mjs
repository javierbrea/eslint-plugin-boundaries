import boundaries from "eslint-plugin-boundaries";

import {
  defaultConfigWithoutTypescript,
  typescriptConfig,
  jestConfig,
  reactConfig,
  reactHooksConfig,
  createBrowserConfig,
} from "../../support/eslint-config/index.js";

// -----------------------------------------------------------------------------
// Layers of src/. Domains organize the code by concept, then by layer; `shared` and `ui-kit` hold what no domain owns. The element types below are named after the layer, so the same type applies under `shared/` and under `domains/<domain>/`
// -----------------------------------------------------------------------------

// Presentational layers: they render, they never read the store
const UI_TYPES = [
  "ui-helper",
  "ui-context",
  "ui-atom",
  "ui-molecule",
  "ui-organism",
  "ui-template",
  "ui-provider",
];

// The same layers without any knowledge of a domain
const UI_KIT_TYPES = UI_TYPES.map((type) => type.replace("ui-", "ui-kit-"));

// Every new element type. A new element never imports a legacy one, so this is also what legacy code may import
const NEW_TYPES = [
  "contract",
  "helper",
  "data",
  "module-hook",
  "module",
  ...UI_TYPES,
  ...UI_KIT_TYPES,
  "testing",
  "app",
];

// Layers that may use React, which are all but the pure ones
const REACT_TYPES = NEW_TYPES.filter(
  (type) => type !== "helper" && type !== "contract"
);

// The legacy layering, which the refactor of the playground structure moves element by element. Task 19 of that refactor removes these types, their policies and their file categories
const LEGACY_TYPES = [
  "legacy-sketch",
  "legacy-engine",
  "legacy-examples",
  "legacy-ui-state",
  "legacy-ui-shared",
  "legacy-ui-pane",
  "legacy-ui-root",
  "legacy-theme",
];

// What each layer may import, always through the entry of the element. Presentational layers climb one step at a time: an atom composes nothing, a molecule composes atoms, an organism composes molecules and organisms, a template composes them all
const UI_ATOM_TARGETS = [
  "ui-helper",
  "ui-context",
  "ui-kit-atom",
  "ui-kit-context",
  "ui-kit-helper",
  "helper",
  "contract",
];
const UI_MOLECULE_TARGETS = [...UI_ATOM_TARGETS, "ui-atom", "ui-kit-molecule"];
const UI_ORGANISM_TARGETS = [
  ...UI_MOLECULE_TARGETS,
  "ui-molecule",
  "ui-organism",
  "ui-kit-organism",
];
const UI_TEMPLATE_TARGETS = [
  ...UI_ORGANISM_TARGETS,
  "ui-template",
  "ui-kit-template",
];
const UI_KIT_ATOM_TARGETS = ["ui-kit-context", "ui-kit-helper", "helper"];
const UI_KIT_MOLECULE_TARGETS = [...UI_KIT_ATOM_TARGETS, "ui-kit-atom"];
const UI_KIT_ORGANISM_TARGETS = [
  ...UI_KIT_MOLECULE_TARGETS,
  "ui-kit-molecule",
  "ui-kit-organism",
];
const UI_KIT_TEMPLATE_TARGETS = [...UI_KIT_ORGANISM_TARGETS, "ui-kit-template"];

const LAYER_TARGETS = {
  // The host contract depends on nothing
  contract: [],
  // Pure TypeScript: no React, no MUI
  helper: ["helper", "contract"],
  // Where state comes from and lives
  data: ["data", "helper", "contract"],
  // Headless orchestration over data and helpers
  "module-hook": ["data", "helper", "module-hook", "contract"],
  // Connects data to ui, so it reaches every presentational layer
  module: [
    "data",
    "module",
    "module-hook",
    "helper",
    ...UI_TYPES,
    ...UI_KIT_TYPES,
    "contract",
  ],
  "ui-helper": ["ui-helper", "ui-kit-helper", "helper", "contract"],
  "ui-context": [
    "ui-context",
    "ui-kit-context",
    "ui-helper",
    "ui-kit-helper",
    "helper",
    "contract",
  ],
  "ui-atom": UI_ATOM_TARGETS,
  "ui-molecule": UI_MOLECULE_TARGETS,
  "ui-organism": UI_ORGANISM_TARGETS,
  "ui-template": UI_TEMPLATE_TARGETS,
  // Mounts a capability around its children, so it may use any presentational layer
  "ui-provider": [...UI_TYPES, ...UI_KIT_TYPES, "helper", "contract"],
  "ui-kit-helper": ["ui-kit-helper", "helper"],
  "ui-kit-context": ["ui-kit-context", "ui-kit-helper", "helper"],
  "ui-kit-atom": UI_KIT_ATOM_TARGETS,
  "ui-kit-molecule": UI_KIT_MOLECULE_TARGETS,
  "ui-kit-organism": UI_KIT_ORGANISM_TARGETS,
  "ui-kit-template": UI_KIT_TEMPLATE_TARGETS,
  "ui-kit-provider": [...UI_KIT_TYPES, "helper"],
  // Test support that specs and page objects share
  testing: ["testing", "helper", ...UI_KIT_TYPES, "contract"],
  // The Playground component, which assembles the shell
  app: ["module", "data", ...UI_TYPES, ...UI_KIT_TYPES, "helper", "contract"],
};

// -----------------------------------------------------------------------------
// Element and file descriptors
// -----------------------------------------------------------------------------

// Element patterns are anchored at the package root, so that a folder of the same name elsewhere is never taken for an element. `name` is always the folder of the element
const shared = (type, folder) => ({
  type,
  // The parentheses capture the folder as `scope`, which selects the elements shared by every domain
  pattern: `src/(shared)/${folder}/*`,
  capture: ["scope", "name"],
  partialMatch: false,
});

const domain = (type, folder) => ({
  type,
  pattern: `src/domains/*/${folder}/*`,
  capture: ["domain", "name"],
  partialMatch: false,
});

const uiKit = (type, folder) => ({
  type,
  pattern: `src/ui-kit/${folder}/*`,
  capture: ["name"],
  partialMatch: false,
});

// The layers that exist both in `shared/` and in every domain. Their folders do not overlap, so their order does not matter, except for the module hooks, which come before the modules because `modules/*` also matches the `hooks` folder
const SHARED_AND_DOMAIN_LAYERS = [
  ["helper", "helpers"],
  ["data", "data"],
  ["module-hook", "modules/hooks"],
  ["ui-helper", "ui/helpers"],
  ["ui-context", "ui/contexts"],
  ["ui-atom", "ui/atoms"],
  ["ui-molecule", "ui/molecules"],
  ["ui-organism", "ui/organisms"],
  ["ui-template", "ui/templates"],
  ["ui-provider", "ui/providers"],
];

const UI_KIT_LAYERS = [
  ["ui-kit-helper", "helpers"],
  ["ui-kit-context", "contexts"],
  ["ui-kit-atom", "atoms"],
  ["ui-kit-molecule", "molecules"],
  ["ui-kit-organism", "organisms"],
  ["ui-kit-template", "templates"],
  ["ui-kit-provider", "providers"],
];

const ELEMENTS = [
  { type: "contract", pattern: "src/contract", partialMatch: false },
  { type: "app", pattern: "src/app", partialMatch: false },
  ...SHARED_AND_DOMAIN_LAYERS.flatMap(([type, folder]) => [
    shared(type, folder),
    domain(type, folder),
  ]),
  // Only domains have modules, which connect their own data to ui
  domain("module", "modules"),
  shared("testing", "testing"),
  ...UI_KIT_LAYERS.map(([type, folder]) => uiKit(type, folder)),
  // Legacy layering, removed by task 19 of the refactor of the playground structure
  { type: "legacy-sketch", pattern: "src/sketch" },
  { type: "legacy-engine", pattern: "src/engine" },
  { type: "legacy-examples", pattern: "src/examples" },
  // The state of an instance and its hooks: the panes depend on it, never the other way round
  { type: "legacy-ui-state", pattern: "src/ui/state" },
  // Presentational pieces that every pane uses, which know nothing of the state
  { type: "legacy-ui-shared", pattern: "src/ui/{common,icons}" },
  // A pane and its parts, such as the project pane or the problems panel
  { type: "legacy-ui-pane", pattern: "src/ui/*", capture: ["pane"] },
  // The workbench, which creates the state and lays out the panes
  { type: "legacy-ui-root", pattern: "src/ui" },
  { type: "legacy-theme", pattern: "src/theme" },
];

const FILES = [
  // The file that an element exposes to the others. Any index.ts matches, so policies also check `fileInternalPath`
  { pattern: "src/**/index.ts", category: "entry" },
  { pattern: "src/index.ts", category: "package-entry" },
  { pattern: "src/**/*.spec.{ts,tsx}", category: "test" },
  // Page objects, the only code that knows how a component is queried and driven in a test
  { pattern: "src/**/*.pom.ts", category: "pom" },
  { pattern: "src/**/*.mock.{ts,tsx}", category: "mock" },
  { pattern: "src/**/*.constants.ts", category: "constants" },
  // Legacy categories, removed by task 19 of the refactor of the playground structure
  { pattern: "src/index.ts", category: "legacy-entry" },
  {
    pattern: ["src/Playground.tsx", "src/Playground.spec.tsx"],
    category: "legacy-app",
  },
  // The fixtures hold what only specs load, such as captured data and the stubs of browser APIs
  {
    pattern: "src/{engine,theme,ui}/**/__fixtures__/**",
    category: "legacy-test",
  },
];

// -----------------------------------------------------------------------------
// Policies
// -----------------------------------------------------------------------------

// The entry of an element. `entry` matches any index.ts, and `fileInternalPath` keeps a nested one, such as the index.ts of a hook that only one module uses, private to its element
const entryOf = (types) => ({
  element: { type: types, fileInternalPath: "index.ts" },
  file: { categories: "entry" },
});

const externalModule = (source) => ({
  module: { origin: "external", source },
});

// Importers of the types of a layer, selected by the folder of the element
const elementNamed = (domainName, names, types = UI_TYPES) => ({
  element: { type: types, captured: { domain: domainName, name: names } },
});

const LEGACY_IMPORTERS = [
  { element: { type: LEGACY_TYPES } },
  { file: { categories: ["legacy-entry", "legacy-app"] } },
];

// A spec of legacy code: a spec in a legacy element, or the spec of the legacy app
const LEGACY_TESTS = [
  { element: { type: LEGACY_TYPES }, file: { categories: "test" } },
  { file: { categories: { allOf: ["legacy-app", "test"] } } },
];

const POLICIES = [
  // An element may always import itself. Restrictions on test, page object and mock files come after and override this
  { allow: { dependency: { relationship: { to: "internal" } } } },

  // The matrix of layers: each type imports only the entries of the types it lists
  ...Object.entries(LAYER_TARGETS).map(([type, targets]) => ({
    from: { element: { type } },
    allow: { to: entryOf(targets) },
  })),

  // The package entry only exposes the component, the contract and the static data (the examples)
  {
    from: { file: { categories: "package-entry" } },
    allow: { to: entryOf(["app", "contract", "data"]) },
  },

  // External modules: each one belongs to the layers that need it, so a helper stays free of React and only the engine knows the evaluation packages
  {
    from: { element: { type: REACT_TYPES } },
    allow: { to: { module: { origin: "external", source: "react" } } },
  },
  {
    from: { element: { type: [...UI_TYPES, ...UI_KIT_TYPES] } },
    allow: {
      to: externalModule([
        "@mui/material",
        "@emotion/react",
        "@emotion/styled",
      ]),
    },
  },
  {
    from: { element: { type: "ui-kit-provider" } },
    allow: { to: externalModule("@emotion/cache") },
  },
  {
    from: elementNamed("project", ["ProjectTree", "ProjectTreeItem"]),
    allow: { to: externalModule("@mui/x-tree-view") },
  },
  {
    from: elementNamed("config", [
      "ConfigEditor",
      "editorDiagnostics",
      "editorTheme",
      "editorHighlight",
      "ConfigEditorSnapshotContext",
    ]),
    allow: {
      to: externalModule([
        "@codemirror/*",
        "codemirror-json5",
        "@lezer/highlight",
      ]),
    },
  },
  {
    from: elementNamed("shell", "ShellRegions"),
    allow: { to: externalModule("react-resizable-panels") },
  },
  {
    from: elementNamed("evaluation", "engine", "helper"),
    allow: {
      to: externalModule([
        "@boundaries/config",
        "@boundaries/policies",
        "@boundaries/elements",
        "@humanwhocodes/momoa",
      ]),
    },
  },
  // Test code and its support may import any external module, such as the testing library
  {
    from: [
      { file: { categories: ["test", "pom", "mock"] } },
      { element: { type: "testing" } },
    ],
    allow: { to: { module: { origin: "external" } } },
  },

  // Legacy code may import any new element and any external module. Core modules are not allowed anywhere, since the playground runs only in browsers
  {
    from: LEGACY_IMPORTERS,
    allow: {
      to: [
        { element: { type: NEW_TYPES } },
        { module: { origin: "external" } },
      ],
    },
  },
  {
    from: { file: { categories: "legacy-entry" } },
    allow: {
      to: [
        { file: { categories: "legacy-app" } },
        { element: { type: "legacy-examples" } },
      ],
    },
  },
  {
    from: { file: { categories: "legacy-app" } },
    allow: { to: { element: { type: ["legacy-ui-root", "legacy-theme"] } } },
  },
  {
    from: { element: { type: "legacy-ui-root" } },
    allow: {
      to: {
        element: {
          type: ["legacy-ui-state", "legacy-ui-shared", "legacy-ui-pane"],
        },
      },
    },
  },
  // A pane imports the tokens that the MUI theme object does not carry: the focus ring and the hover of its own rows, and the type scale for CodeMirror, whose theme is built before any MUI theme exists. The rest of the theme reaches a pane through `styled`
  {
    from: { element: { type: "legacy-ui-pane" } },
    allow: {
      to: {
        element: {
          type: [
            "legacy-sketch",
            "legacy-engine",
            "legacy-theme",
            "legacy-ui-state",
            "legacy-ui-shared",
          ],
        },
      },
    },
  },
  // The node pane shows the config with the editor of the config pane
  {
    from: { element: { type: "legacy-ui-pane", captured: { pane: "node" } } },
    allow: {
      to: {
        element: { type: "legacy-ui-pane", captured: { pane: "config" } },
      },
    },
  },
  {
    from: { element: { type: "legacy-ui-state" } },
    allow: {
      to: {
        element: {
          type: ["legacy-sketch", "legacy-engine", "legacy-ui-shared"],
        },
      },
    },
  },
  {
    from: { element: { type: "legacy-ui-shared" } },
    allow: { to: { element: { type: "legacy-ui-shared" } } },
  },
  // The engine also reads the sketch, so that both agree on which nodes are files
  {
    from: { element: { type: "legacy-engine" } },
    allow: { to: { element: { type: "legacy-sketch" } } },
  },

  // Test, page object and mock files are test support: nothing imports them unless a policy below allows it
  {
    disallow: { to: { file: { categories: ["test", "legacy-test"] } } },
    message: "Do not import test files from source code",
  },
  {
    disallow: { to: { file: { categories: "pom" } } },
    message:
      "Only specs and other page objects import a page object. Production code never does",
  },
  {
    disallow: { to: { file: { categories: "mock" } } },
    message:
      "Only specs import a mock. Production code and page objects never do",
  },

  // A spec may import the entry of any new element, which includes the testing support, and the page objects, constants and mocks that it drives, by file
  {
    from: { file: { categories: "test" } },
    allow: {
      to: [
        entryOf(NEW_TYPES),
        { file: { categories: ["pom", "constants", "mock"] } },
      ],
    },
  },
  // A page object composes the page objects of the components it contains and the testing support
  {
    from: { file: { categories: "pom" } },
    allow: {
      to: [{ file: { categories: ["pom", "constants"] } }, entryOf("testing")],
    },
  },
  // A mock wraps its own element, so it reads the entries of the others
  {
    from: { file: { categories: "mock" } },
    allow: { to: entryOf(NEW_TYPES) },
  },
  // Legacy specs keep importing what they imported, and the fixtures that only they load
  {
    from: LEGACY_TESTS,
    allow: {
      to: [
        { element: { type: LEGACY_TYPES } },
        { file: { categories: ["legacy-entry", "legacy-app", "legacy-test"] } },
      ],
    },
  },
  {
    from: { file: { categories: "legacy-test" } },
    allow: { to: { file: { categories: "legacy-test" } } },
  },

  // Domains organize the code, they do not isolate it, except for these three limits. They come last, so that no allowance above reopens them
  {
    from: [
      { element: { captured: { scope: "shared" } } },
      { element: { type: UI_KIT_TYPES } },
    ],
    disallow: { to: { element: { captured: { domain: "*" } } } },
    message:
      "shared and ui-kit never depend on a domain: they know no concept of the playground",
  },
  {
    from: { element: { captured: { domain: "!shell" } } },
    disallow: { to: { element: { captured: { domain: "shell" } } } },
    message:
      "Only the app and the shell domain depend on the shell, which places the panes of the other domains",
  },
  {
    from: { element: { captured: { domain: "session" } } },
    disallow: {
      to: {
        element: { captured: { domain: "!(session|project|evaluation)" } },
      },
    },
    message:
      "The session domain depends on no other domain than project and evaluation, so that every other domain can depend on it",
  },
  {
    from: { element: { captured: { domain: "session" } } },
    disallow: {
      to: {
        element: {
          type: "!helper",
          captured: { domain: ["project", "evaluation"] },
        },
      },
    },
    message:
      "The session domain depends only on the helpers of project and evaluation",
  },
];

// -----------------------------------------------------------------------------
// Syntax guards. Flat config replaces the options of a rule for the files that a later block matches, so each guard has its own block and the shared options come from one constant
// -----------------------------------------------------------------------------

// The host owns the page, so the playground never imports from one
const HOST_IMPORT_PATTERN = {
  group: [
    "@docusaurus/*",
    "@theme/*",
    "@theme-original/*",
    "@theme-init/*",
    "@generated/*",
    "@site/*",
    "infima",
    "infima/*",
  ],
  message:
    "The playground is host-agnostic: it receives what it needs through its props.",
};

// An import of another folder goes through the "@/" alias, which names the element, so a move updates one path
const PARENT_IMPORT_PATTERN = {
  group: ["..", "../*"],
  message:
    'Import another folder through the "@/" alias. A file of the same folder is imported as "./name".',
};

const SHARED_IMPORT_PATTERNS = [HOST_IMPORT_PATTERN, PARENT_IMPORT_PATTERN];

// Specs of components, which go through page objects. The specs of code that renders no component drive probe components, or none, so they query the DOM as they need
const COMPONENT_SPECS = {
  files: ["src/{app,ui-kit,shared,domains}/**/*.spec.{ts,tsx}"],
  ignores: [
    "**/helpers/**",
    "**/data/**",
    "**/contexts/**",
    "**/hooks/**",
    "src/shared/testing/**",
  ],
};

const PAGE_OBJECT_MESSAGE =
  "Query and act through the page object of the component.";

export default [
  ...defaultConfigWithoutTypescript,
  jestConfig,
  {
    ...typescriptConfig,
    languageOptions: {
      ...typescriptConfig.languageOptions,
      parserOptions: {
        project: "./tsconfig.eslint.json",
      },
    },
  },
  reactConfig,
  reactHooksConfig,
  {
    files: ["**/*.tsx", "**/*.ts"],
    rules: {
      "react/prop-types": "off",
    },
  },
  createBrowserConfig(
    "The playground runs only in browsers; the host passes what it needs through the contract."
  ),
  // The rule resolves a mocked module only as a relative path or a package, so it cannot follow the "@/" alias that jest.config.cjs maps
  {
    files: ["src/**/*.spec.{ts,tsx}"],
    rules: {
      "jest/valid-mock-module-path": "off",
    },
  },
  // Every file keeps the host out and imports other folders through the alias
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: SHARED_IMPORT_PATTERNS }],
    },
  },
  // The specs of components also leave the queries and the events to the page object
  {
    ...COMPONENT_SPECS,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: SHARED_IMPORT_PATTERNS,
          paths: ["@testing-library/react", "@testing-library/dom"].map(
            (name) => ({
              name,
              importNames: ["screen", "within", "fireEvent"],
              message: PAGE_OBJECT_MESSAGE,
            })
          ),
        },
      ],
    },
  },
  // A component file exports its component and nothing else: the props type and the constants live in sibling files, so that the component can be imported without them
  {
    files: ["src/{app,ui-kit,shared,domains}/**/[A-Z]*.tsx"],
    ignores: ["**/*.spec.tsx", "**/*.mock.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...[
          "ExportNamedDeclaration ~ ExportNamedDeclaration",
          "ExportDefaultDeclaration",
          "ExportAllDeclaration",
          "ExportNamedDeclaration[exportKind='type']",
          "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > Identifier.id[name!=/^[A-Z]/]",
          "ExportNamedDeclaration > FunctionDeclaration > Identifier.id[name!=/^[A-Z]/]",
          "ExportNamedDeclaration > ClassDeclaration > Identifier.id[name!=/^[A-Z]/]",
          "ExportNamedDeclaration > ExportSpecifier[exported.name!=/^[A-Z]/]",
        ].map((selector) => ({
          selector,
          message:
            "A component file exports only its component, named as the file. Props types go to <Name>.types.ts, constants to <Name>.constants.ts, and other components to their own element.",
        })),
      ],
    },
  },
  // A barrel only re-exports the public API of its element: no logic, no `export *`, no import
  {
    files: ["src/{app,ui-kit,shared,domains}/**/index.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Program > :not(ExportNamedDeclaration[source])",
          message:
            'A barrel only re-exports named bindings of its element: export { X } from "./X". No logic, no `export *`.',
        },
      ],
    },
  },
  // The specs of components never query the DOM themselves
  {
    ...COMPONENT_SPECS,
    rules: {
      "no-restricted-syntax": [
        "error",
        ...[
          "VariableDeclarator[init.callee.name=/^render(InRoot|InSession)?$/] > ObjectPattern > Property[key.name=/^(container|(get|query|find)(All)?By.*)$/]",
          "CallExpression[callee.object.name='document'][callee.property.name=/^querySelector/]",
        ].map((selector) => ({ selector, message: PAGE_OBJECT_MESSAGE })),
      ],
    },
  },
  // The package's own layering, enforced with the workspace eslint-plugin-boundaries
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      boundaries,
    },
    settings: {
      "boundaries/elements": ELEMENTS,
      "boundaries/files": FILES,
      // The workspace packages resolve to their folders outside node_modules, so checkUnknownLocals would report them as unknown local files
      "boundaries/flag-as-external": {
        customSourcePatterns: ["@boundaries/*"],
      },
    },
    rules: {
      ...boundaries.configs.recommended.rules,
      // Every source file belongs to an element or a file category, so a new folder is classified before it is used
      "boundaries/no-unknown-files": [2],
      "boundaries/dependencies": [
        2,
        {
          default: "disallow",
          // A relative import out of src/, such as one into the website, reaches no element, and is reported instead of skipped
          checkUnknownLocals: true,
          // External and core modules are checked too: each layer lists the packages it may use
          checkAllOrigins: true,
          // An import of a file of the same element is checked too, since a page object or a mock must stay out of production code
          checkInternals: true,
          policies: POLICIES,
        },
      ],
    },
  },
];
