import type {
  DependencyDescription,
  EntityDescription,
} from "@boundaries/elements";
import { ORIGINS_MAP } from "@boundaries/elements";
import type { Rule } from "eslint";

import { warnOnce } from "../Debug";
import type { EslintLiteralNode } from "../Elements";
import type { NoUnknownDependenciesOptions } from "../Shared";
import { RULE_NAMES_MAP } from "../Shared";

jest.mock("../Debug", () => ({
  warnOnce: jest.fn(),
}));

jest.mock("./Support", () => ({
  dependencyRule: jest.fn(
    (
      meta: unknown,
      handler: (args: {
        dependency: DependencyDescription;
        node: EslintLiteralNode;
        context: Rule.RuleContext;
        options?: NoUnknownDependenciesOptions;
      }) => void
    ) => ({ meta, handler })
  ),
}));

import getNoUnknownDependenciesRule from "./NoUnknown";
import { dependencyRule } from "./Support";

const warnOnceMock = warnOnce as jest.MockedFunction<typeof warnOnce>;
const dependencyRuleMock = dependencyRule as jest.MockedFunction<
  typeof dependencyRule
>;

type NoUnknownHandler = (args: {
  dependency: DependencyDescription;
  node: EslintLiteralNode;
  context: Rule.RuleContext;
  options?: NoUnknownDependenciesOptions;
}) => void;

const createEntityDescription = (
  overrides: {
    element?: Partial<EntityDescription["element"]>;
    file?: Partial<EntityDescription["file"]>;
    module?: Partial<EntityDescription["module"]>;
  } = {}
): EntityDescription => ({
  element: {
    path: "/repo/src/component/index.ts",
    types: ["component"],
    category: null,
    filePath: "/repo/src/component/index.ts",
    fileInternalPath: "index.ts",
    captured: null,
    parents: [],
    isIgnored: false,
    isUnknown: false,
    ...overrides.element,
  },
  file: {
    path: "/repo/src/component/index.ts",
    categories: ["component"],
    captured: null,
    isIgnored: false,
    isUnknown: false,
    ...overrides.file,
  },
  module: {
    origin: ORIGINS_MAP.LOCAL,
    source: null,
    internalPath: null,
    ...overrides.module,
  },
});

const createDependencyDescription = (
  overrides: Partial<DependencyDescription> = {}
): DependencyDescription => ({
  from: createEntityDescription(),
  to: createEntityDescription(),
  dependency: {
    source: "./unknown",
    kind: "value",
    nodeKind: "ImportDeclaration",
    specifiers: [],
    relationship: { from: "sibling", to: "sibling" },
  },
  ...overrides,
});

const callHandler = (
  ruleName: Parameters<typeof getNoUnknownDependenciesRule>[0],
  args: Parameters<NoUnknownHandler>[0]
): void => {
  getNoUnknownDependenciesRule(ruleName);
  const lastCall =
    dependencyRuleMock.mock.calls[dependencyRuleMock.mock.calls.length - 1];
  const handler = lastCall[1] as NoUnknownHandler;
  handler(args);
};

const createCallArgs = (
  dependency: DependencyDescription,
  options?: NoUnknownDependenciesOptions
) => ({
  dependency,
  node: {} as EslintLiteralNode,
  context: { report: jest.fn() } as unknown as Rule.RuleContext,
  options,
});

describe("NoUnknown", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("no-unknown-dependencies rule handler", () => {
    it("does not report when dependency target element is known", () => {
      const args = createCallArgs(
        createDependencyDescription({
          to: createEntityDescription({ element: { isUnknown: false } }),
        }),
        {}
      );

      callHandler(undefined, args);

      expect(args.context.report).not.toHaveBeenCalled();
    });

    it("does not report (default options) when only the element is unknown", () => {
      const args = createCallArgs(
        createDependencyDescription({
          to: createEntityDescription({
            element: { isUnknown: true },
            file: { isUnknown: false },
          }),
        }),
        {}
      );

      callHandler(undefined, args);

      expect(args.context.report).not.toHaveBeenCalled();
    });

    it("does not report (default options) when only the file is unknown", () => {
      const args = createCallArgs(
        createDependencyDescription({
          to: createEntityDescription({
            element: { isUnknown: false },
            file: { isUnknown: true },
          }),
        }),
        {}
      );

      callHandler(undefined, args);

      expect(args.context.report).not.toHaveBeenCalled();
    });

    it("reports combined message (default options) when both element and file are unknown", () => {
      const args = createCallArgs(
        createDependencyDescription({
          to: createEntityDescription({
            element: { isUnknown: true },
            file: { isUnknown: true },
          }),
        }),
        {}
      );

      callHandler(undefined, args);

      expect(args.context.report).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Dependencies to unknown elements and files are not allowed",
        })
      );
    });

    it('reports when require is "element" and the element is unknown, regardless of the file', () => {
      const args = createCallArgs(
        createDependencyDescription({
          to: createEntityDescription({
            element: { isUnknown: true },
            file: { isUnknown: false },
          }),
        }),
        { require: "element" }
      );

      callHandler(undefined, args);

      expect(args.context.report).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Dependencies to unknown elements are not allowed",
        })
      );
    });

    it('does not report when require is "element" and only the file is unknown', () => {
      const args = createCallArgs(
        createDependencyDescription({
          to: createEntityDescription({
            element: { isUnknown: false },
            file: { isUnknown: true },
          }),
        }),
        { require: "element" }
      );

      callHandler(undefined, args);

      expect(args.context.report).not.toHaveBeenCalled();
    });

    it('reports when require is "file" and the file is unknown, regardless of the element', () => {
      const args = createCallArgs(
        createDependencyDescription({
          to: createEntityDescription({
            element: { isUnknown: false },
            file: { isUnknown: true },
          }),
        }),
        { require: "file" }
      );

      callHandler(undefined, args);

      expect(args.context.report).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Dependencies to unknown files are not allowed",
        })
      );
    });

    it('does not report when require is "file" and only the element is unknown', () => {
      const args = createCallArgs(
        createDependencyDescription({
          to: createEntityDescription({
            element: { isUnknown: true },
            file: { isUnknown: false },
          }),
        }),
        { require: "file" }
      );

      callHandler(undefined, args);

      expect(args.context.report).not.toHaveBeenCalled();
    });

    it('reports "unknown elements" message when require is "all" and only the element is unknown', () => {
      const args = createCallArgs(
        createDependencyDescription({
          to: createEntityDescription({
            element: { isUnknown: true },
            file: { isUnknown: false },
          }),
        }),
        { require: "all" }
      );

      callHandler(undefined, args);

      expect(args.context.report).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Dependencies to unknown elements are not allowed",
        })
      );
    });

    it('reports "unknown files" message when require is "all" and only the file is unknown', () => {
      const args = createCallArgs(
        createDependencyDescription({
          to: createEntityDescription({
            element: { isUnknown: false },
            file: { isUnknown: true },
          }),
        }),
        { require: "all" }
      );

      callHandler(undefined, args);

      expect(args.context.report).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Dependencies to unknown files are not allowed",
        })
      );
    });

    it('reports combined message when require is "all" and both element and file are unknown', () => {
      const args = createCallArgs(
        createDependencyDescription({
          to: createEntityDescription({
            element: { isUnknown: true },
            file: { isUnknown: true },
          }),
        }),
        { require: "all" }
      );

      callHandler(undefined, args);

      expect(args.context.report).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Dependencies to unknown elements and files are not allowed",
        })
      );
    });

    it('does not report when require is "all" and both element and file are known', () => {
      const args = createCallArgs(
        createDependencyDescription({
          to: createEntityDescription({
            element: { isUnknown: false },
            file: { isUnknown: false },
          }),
        }),
        { require: "all" }
      );

      callHandler(undefined, args);

      expect(args.context.report).not.toHaveBeenCalled();
    });

    it("does not report when dependency target element is ignored", () => {
      const args = createCallArgs(
        createDependencyDescription({
          to: createEntityDescription({
            element: { isUnknown: true, isIgnored: true },
          }),
        }),
        { require: "element" }
      );

      callHandler(undefined, args);

      expect(args.context.report).not.toHaveBeenCalled();
    });

    it("does not report when dependency target file is ignored", () => {
      const args = createCallArgs(
        createDependencyDescription({
          to: createEntityDescription({
            element: { isUnknown: false },
            file: { isUnknown: true, isIgnored: true },
          }),
        }),
        { require: "file" }
      );

      callHandler(undefined, args);

      expect(args.context.report).not.toHaveBeenCalled();
    });

    it("does not report for non-local dependencies", () => {
      const args = createCallArgs(
        createDependencyDescription({
          to: createEntityDescription({
            element: { isUnknown: true },
            module: { origin: ORIGINS_MAP.EXTERNAL },
          }),
        }),
        { require: "element" }
      );

      callHandler(undefined, args);

      expect(args.context.report).not.toHaveBeenCalled();
    });

    it("emits deprecation warning when called with the deprecated no-unknown rule name", () => {
      const args = createCallArgs(
        createDependencyDescription({
          to: createEntityDescription({ element: { isUnknown: false } }),
        }),
        {}
      );

      callHandler(RULE_NAMES_MAP.NO_UNKNOWN, args);

      expect(warnOnceMock).toHaveBeenCalledTimes(1);
      expect(warnOnceMock.mock.calls[0][0]).toContain(
        RULE_NAMES_MAP.NO_UNKNOWN
      );
    });

    it("does not emit deprecation warning when called with the default rule name", () => {
      const args = createCallArgs(
        createDependencyDescription({
          to: createEntityDescription({ element: { isUnknown: false } }),
        }),
        {}
      );

      callHandler(undefined, args);

      expect(warnOnceMock).not.toHaveBeenCalled();
    });
  });
});
