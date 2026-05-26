import type { MatchersOptionsNormalized } from "../../Config";
import type {
  DependencyDescription,
  DependencyInfoDescription,
  EntityDescription,
} from "../../Descriptor";
import type {
  EntitiesMatcher,
  EntitySingleSelectorMatchResult,
} from "../Entity";
import type { Micromatch } from "../Shared";

import { DependenciesMatcher } from "./DependencyMatcher";
import type {
  DependencyInfoSingleSelector,
  DependencySingleSelectorNormalized,
  BackwardCompatibleDependencySelector,
} from "./DependencySelector.types";
import { normalizeDependencySelector } from "./DependencySelectorHelpers";

jest.mock("./DependencySelectorHelpers");
jest.mock("../Shared/Micromatch");

const mockedNormalizeDependencySelector = jest.mocked(
  normalizeDependencySelector
);

describe("DependenciesMatcher", () => {
  const MOCK_CONFIG: MatchersOptionsNormalized = { legacyTemplates: false };

  let micromatch: jest.Mocked<Micromatch>;
  let entitiesMatcher: jest.Mocked<EntitiesMatcher>;
  let matcher: DependenciesMatcher;

  beforeEach(() => {
    jest.clearAllMocks();
    micromatch = {
      isMatch: jest.fn(),
    } as unknown as jest.Mocked<Micromatch>;
    entitiesMatcher = {
      getSelectorMatching: jest.fn(),
    } as unknown as jest.Mocked<EntitiesMatcher>;
    matcher = new DependenciesMatcher(entitiesMatcher, MOCK_CONFIG, micromatch);
  });

  function createEntityDescription(
    overrides: Partial<EntityDescription> = {}
  ): EntityDescription {
    return {
      element: { type: "component", internalPath: null },
      file: { path: "src/Component.ts", extension: ".ts" },
      module: { origin: "local", source: null, internalPath: null },
      ...overrides,
    } as EntityDescription;
  }

  function createDependencyInfo(
    overrides: Partial<DependencyInfoDescription> = {}
  ): DependencyInfoDescription {
    return {
      source: "./module",
      kind: "value",
      nodeKind: "ImportDeclaration",
      specifiers: ["default"],
      relationship: { from: "child", to: "parent" },
      ...overrides,
    } as DependencyInfoDescription;
  }

  function createDependencyDescription(
    overrides: Partial<DependencyDescription> = {}
  ): DependencyDescription {
    return {
      from: createEntityDescription(),
      to: createEntityDescription(),
      dependency: createDependencyInfo(),
      ...overrides,
    };
  }

  describe("constructor", () => {
    it("should create an instance of DependenciesMatcher", () => {
      expect(matcher).toBeInstanceOf(DependenciesMatcher);
    });
  });

  describe("getSelectorMatching", () => {
    it("should normalize the selector and iterate over normalized selectors", () => {
      const dependency = createDependencyDescription();
      const selector: BackwardCompatibleDependencySelector = { from: [] };
      const normalizedSelector: DependencySingleSelectorNormalized = {};
      mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);

      matcher.getSelectorMatching(dependency, selector);

      expect(mockedNormalizeDependencySelector).toHaveBeenCalledWith(selector);
    });

    it("should return null when the normalized selectors array is empty", () => {
      const dependency = createDependencyDescription();
      mockedNormalizeDependencySelector.mockReturnValue([]);

      const result = matcher.getSelectorMatching(dependency, []);

      expect(result).toBeNull();
    });

    it("should return empty object when selector has no from, to, or dependency", () => {
      const dependency = createDependencyDescription();
      const normalizedSelector: DependencySingleSelectorNormalized = {};
      mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);

      const result = matcher.getSelectorMatching(dependency, {});

      expect(result).toEqual({});
    });

    it("should delegate from matching to entitiesMatcher", () => {
      const dependency = createDependencyDescription();
      const fromSelector = [{ element: { type: "component" } }];
      const normalizedSelector: DependencySingleSelectorNormalized = {
        from: fromSelector as DependencySingleSelectorNormalized["from"],
      };
      mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);
      const entityMatchResult: EntitySingleSelectorMatchResult = {
        element: { type: "component" },
      };
      entitiesMatcher.getSelectorMatching.mockReturnValue(entityMatchResult);

      const result = matcher.getSelectorMatching(dependency, {});

      expect(entitiesMatcher.getSelectorMatching).toHaveBeenCalledWith(
        dependency.from,
        fromSelector,
        expect.objectContaining({ extraTemplateData: expect.any(Object) })
      );
      expect(result).toEqual({ from: entityMatchResult });
    });

    it("should delegate to matching to entitiesMatcher", () => {
      const dependency = createDependencyDescription();
      const toSelector = [{ element: { type: "helper" } }];
      const normalizedSelector: DependencySingleSelectorNormalized = {
        to: toSelector as DependencySingleSelectorNormalized["to"],
      };
      mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);
      const entityMatchResult: EntitySingleSelectorMatchResult = {
        element: { type: "helper" },
      };
      entitiesMatcher.getSelectorMatching.mockReturnValue(entityMatchResult);

      const result = matcher.getSelectorMatching(dependency, {});

      expect(entitiesMatcher.getSelectorMatching).toHaveBeenCalledWith(
        dependency.to,
        toSelector,
        expect.objectContaining({ extraTemplateData: expect.any(Object) })
      );
      expect(result).toEqual({ to: entityMatchResult });
    });

    it("should return null when from selector does not match", () => {
      const dependency = createDependencyDescription();
      const fromSelector = [{ element: { type: "component" } }];
      const normalizedSelector: DependencySingleSelectorNormalized = {
        from: fromSelector as DependencySingleSelectorNormalized["from"],
      };
      mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);
      entitiesMatcher.getSelectorMatching.mockReturnValue(null);

      const result = matcher.getSelectorMatching(dependency, {});

      expect(result).toBeNull();
    });

    it("should return null when to selector does not match", () => {
      const dependency = createDependencyDescription();
      const toSelector = [{ element: { type: "helper" } }];
      const normalizedSelector: DependencySingleSelectorNormalized = {
        to: toSelector as DependencySingleSelectorNormalized["to"],
      };
      mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);
      entitiesMatcher.getSelectorMatching.mockReturnValue(null);

      const result = matcher.getSelectorMatching(dependency, {});

      expect(result).toBeNull();
    });

    it("should match dependency metadata when selector has dependency property", () => {
      const dependency = createDependencyDescription();
      const dependencySelector: DependencyInfoSingleSelector[] = [
        { kind: "value" },
      ];
      const normalizedSelector: DependencySingleSelectorNormalized = {
        dependency: dependencySelector,
      };
      mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.getSelectorMatching(dependency, {});

      expect(result).toEqual({ dependency: { kind: "value" } });
    });

    it("should return null when dependency metadata does not match", () => {
      const dependency = createDependencyDescription();
      const dependencySelector: DependencyInfoSingleSelector[] = [
        { kind: "type" },
      ];
      const normalizedSelector: DependencySingleSelectorNormalized = {
        dependency: dependencySelector,
      };
      mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.getSelectorMatching(dependency, {});

      expect(result).toBeNull();
    });

    it("should match when all from, to and dependency selectors match", () => {
      const dependency = createDependencyDescription();
      const fromSelector = [{ element: { type: "component" } }];
      const toSelector = [{ element: { type: "helper" } }];
      const dependencySelector: DependencyInfoSingleSelector[] = [
        { kind: "value" },
      ];
      const normalizedSelector: DependencySingleSelectorNormalized = {
        from: fromSelector as DependencySingleSelectorNormalized["from"],
        to: toSelector as DependencySingleSelectorNormalized["to"],
        dependency: dependencySelector,
      };
      mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);

      const fromMatchResult: EntitySingleSelectorMatchResult = {
        element: { type: "component" },
      };
      const toMatchResult: EntitySingleSelectorMatchResult = {
        element: { type: "helper" },
      };
      entitiesMatcher.getSelectorMatching
        .mockReturnValueOnce(fromMatchResult)
        .mockReturnValueOnce(toMatchResult);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.getSelectorMatching(dependency, {});

      expect(result).toEqual({
        from: fromMatchResult,
        to: toMatchResult,
        dependency: { kind: "value" },
      });
    });

    it("should return null when from matches but to does not", () => {
      const dependency = createDependencyDescription();
      const fromSelector = [{ element: { type: "component" } }];
      const toSelector = [{ element: { type: "helper" } }];
      const normalizedSelector: DependencySingleSelectorNormalized = {
        from: fromSelector as DependencySingleSelectorNormalized["from"],
        to: toSelector as DependencySingleSelectorNormalized["to"],
      };
      mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);
      const fromMatchResult: EntitySingleSelectorMatchResult = {
        element: { type: "component" },
      };
      entitiesMatcher.getSelectorMatching
        .mockReturnValueOnce(fromMatchResult)
        .mockReturnValueOnce(null);

      const result = matcher.getSelectorMatching(dependency, {});

      expect(result).toBeNull();
    });

    it("should return the first matching selector from multiple selectors", () => {
      const dependency = createDependencyDescription();
      const firstSelector: DependencySingleSelectorNormalized = {
        from: [
          { element: { type: "wrong" } },
        ] as DependencySingleSelectorNormalized["from"],
      };
      const secondSelector: DependencySingleSelectorNormalized = {
        from: [
          { element: { type: "component" } },
        ] as DependencySingleSelectorNormalized["from"],
      };
      mockedNormalizeDependencySelector.mockReturnValue([
        firstSelector,
        secondSelector,
      ]);
      const matchResult: EntitySingleSelectorMatchResult = {
        element: { type: "component" },
      };
      entitiesMatcher.getSelectorMatching
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(matchResult);

      const result = matcher.getSelectorMatching(dependency, {});

      expect(result).toEqual({ from: matchResult });
    });

    it("should build template data with from, to, and dependency information", () => {
      const fromEntity = createEntityDescription({
        element: { type: "component", internalPath: null },
      } as Partial<EntityDescription>);
      const toEntity = createEntityDescription({
        element: { type: "helper", internalPath: null },
      } as Partial<EntityDescription>);
      const dependencyInfo = createDependencyInfo({ kind: "value" });
      const dependency = createDependencyDescription({
        from: fromEntity,
        to: toEntity,
        dependency: dependencyInfo,
      });
      const fromSelector = [{ element: { type: "component" } }];
      const normalizedSelector: DependencySingleSelectorNormalized = {
        from: fromSelector as DependencySingleSelectorNormalized["from"],
      };
      mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);
      entitiesMatcher.getSelectorMatching.mockReturnValue(null);

      matcher.getSelectorMatching(dependency, {});

      expect(entitiesMatcher.getSelectorMatching).toHaveBeenCalledWith(
        fromEntity,
        fromSelector,
        {
          extraTemplateData: expect.objectContaining({
            from: expect.objectContaining(fromEntity),
            to: expect.objectContaining(toEntity),
            dependency: dependencyInfo,
          }),
        }
      );
    });

    it("should merge extraTemplateData with dependency data in template", () => {
      const dependency = createDependencyDescription();
      const fromSelector = [{ element: { type: "component" } }];
      const normalizedSelector: DependencySingleSelectorNormalized = {
        from: fromSelector as DependencySingleSelectorNormalized["from"],
      };
      mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);
      entitiesMatcher.getSelectorMatching.mockReturnValue(null);

      matcher.getSelectorMatching(
        dependency,
        {},
        {
          extraTemplateData: {
            from: { customProp: "value" },
            to: { anotherProp: "other" },
          },
        }
      );

      expect(entitiesMatcher.getSelectorMatching).toHaveBeenCalledWith(
        dependency.from,
        fromSelector,
        {
          extraTemplateData: expect.objectContaining({
            from: expect.objectContaining({ customProp: "value" }),
            to: expect.objectContaining({ anotherProp: "other" }),
            dependency: dependency.dependency,
          }),
        }
      );
    });

    it("should use default empty extraTemplateData when options are not provided", () => {
      const dependency = createDependencyDescription();
      const fromSelector = [{ element: { type: "component" } }];
      const normalizedSelector: DependencySingleSelectorNormalized = {
        from: fromSelector as DependencySingleSelectorNormalized["from"],
      };
      mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);
      entitiesMatcher.getSelectorMatching.mockReturnValue(null);

      matcher.getSelectorMatching(dependency, {});

      expect(entitiesMatcher.getSelectorMatching).toHaveBeenCalledWith(
        dependency.from,
        fromSelector,
        {
          extraTemplateData: expect.objectContaining({
            from: expect.objectContaining(dependency.from),
            to: expect.objectContaining(dependency.to),
          }),
        }
      );
    });

    describe("dependency metadata matching", () => {
      it("should match kind property using micromatch", () => {
        const dependency = createDependencyDescription({
          dependency: createDependencyInfo({ kind: "value" }),
        });
        const dependencySelector: DependencyInfoSingleSelector[] = [
          { kind: "value" },
        ];
        const normalizedSelector: DependencySingleSelectorNormalized = {
          dependency: dependencySelector,
        };
        mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);
        micromatch.isMatch.mockReturnValue(true);

        const result = matcher.getSelectorMatching(dependency, {});

        expect(micromatch.isMatch).toHaveBeenCalled();
        expect(result).toEqual({ dependency: { kind: "value" } });
      });

      it("should match nodeKind property using micromatch", () => {
        const dependency = createDependencyDescription({
          dependency: createDependencyInfo({
            nodeKind: "ImportDeclaration",
          }),
        });
        const dependencySelector: DependencyInfoSingleSelector[] = [
          { nodeKind: "ImportDeclaration" },
        ];
        const normalizedSelector: DependencySingleSelectorNormalized = {
          dependency: dependencySelector,
        };
        mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);
        micromatch.isMatch.mockReturnValue(true);

        const result = matcher.getSelectorMatching(dependency, {});

        expect(result).toEqual({
          dependency: { nodeKind: "ImportDeclaration" },
        });
      });

      it("should match source property using micromatch", () => {
        const dependency = createDependencyDescription({
          dependency: createDependencyInfo({ source: "./my-module" }),
        });
        const dependencySelector: DependencyInfoSingleSelector[] = [
          { source: "./my-*" },
        ];
        const normalizedSelector: DependencySingleSelectorNormalized = {
          dependency: dependencySelector,
        };
        mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);
        micromatch.isMatch.mockReturnValue(true);

        const result = matcher.getSelectorMatching(dependency, {});

        expect(result).toEqual({ dependency: { source: "./my-*" } });
      });

      it("should match relationship.from using micromatch", () => {
        const dependency = createDependencyDescription({
          dependency: createDependencyInfo({
            relationship: { from: "child", to: "parent" },
          }),
        });
        const dependencySelector: DependencyInfoSingleSelector[] = [
          { relationship: { from: "child" } },
        ];
        const normalizedSelector: DependencySingleSelectorNormalized = {
          dependency: dependencySelector,
        };
        mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);
        micromatch.isMatch.mockReturnValue(true);

        const result = matcher.getSelectorMatching(dependency, {});

        expect(result).toEqual({
          dependency: { relationship: { from: "child" } },
        });
      });

      it("should match relationship.to using micromatch", () => {
        const dependency = createDependencyDescription({
          dependency: createDependencyInfo({
            relationship: { from: "child", to: "parent" },
          }),
        });
        const dependencySelector: DependencyInfoSingleSelector[] = [
          { relationship: { to: "parent" } },
        ];
        const normalizedSelector: DependencySingleSelectorNormalized = {
          dependency: dependencySelector,
        };
        mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);
        micromatch.isMatch.mockReturnValue(true);

        const result = matcher.getSelectorMatching(dependency, {});

        expect(result).toEqual({
          dependency: { relationship: { to: "parent" } },
        });
      });

      it("should match specifiers property using micromatch", () => {
        const dependency = createDependencyDescription({
          dependency: createDependencyInfo({
            specifiers: ["namedExport", "default"],
          }),
        });
        const dependencySelector: DependencyInfoSingleSelector[] = [
          { specifiers: "named*" },
        ];
        const normalizedSelector: DependencySingleSelectorNormalized = {
          dependency: dependencySelector,
        };
        mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);
        micromatch.isMatch.mockReturnValue(true);

        const result = matcher.getSelectorMatching(dependency, {});

        expect(result).toEqual({ dependency: { specifiers: "named*" } });
      });

      it("should not match when kind does not match", () => {
        const dependency = createDependencyDescription({
          dependency: createDependencyInfo({ kind: "type" }),
        });
        const dependencySelector: DependencyInfoSingleSelector[] = [
          { kind: "value" },
        ];
        const normalizedSelector: DependencySingleSelectorNormalized = {
          dependency: dependencySelector,
        };
        mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);
        micromatch.isMatch.mockReturnValue(false);

        const result = matcher.getSelectorMatching(dependency, {});

        expect(result).toBeNull();
      });

      it("should try all dependency info selectors and return the first match", () => {
        const dependency = createDependencyDescription({
          dependency: createDependencyInfo({ kind: "value" }),
        });
        const dependencySelector: DependencyInfoSingleSelector[] = [
          { kind: "type" },
          { kind: "value" },
        ];
        const normalizedSelector: DependencySingleSelectorNormalized = {
          dependency: dependencySelector,
        };
        mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);
        micromatch.isMatch.mockReturnValueOnce(false).mockReturnValueOnce(true);

        const result = matcher.getSelectorMatching(dependency, {});

        expect(result).toEqual({ dependency: { kind: "value" } });
      });

      it("should match when selector has no specific dependency properties", () => {
        const dependency = createDependencyDescription();
        const dependencySelector: DependencyInfoSingleSelector[] = [{}];
        const normalizedSelector: DependencySingleSelectorNormalized = {
          dependency: dependencySelector,
        };
        mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);

        const result = matcher.getSelectorMatching(dependency, {});

        expect(result).toEqual({ dependency: {} });
      });

      it("should require all specified dependency properties to match", () => {
        const dependency = createDependencyDescription({
          dependency: createDependencyInfo({
            kind: "value",
            source: "./module",
          }),
        });
        const dependencySelector: DependencyInfoSingleSelector[] = [
          { kind: "value", source: "./other" },
        ];
        const normalizedSelector: DependencySingleSelectorNormalized = {
          dependency: dependencySelector,
        };
        mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);
        micromatch.isMatch.mockReturnValueOnce(true).mockReturnValueOnce(false);

        const result = matcher.getSelectorMatching(dependency, {});

        expect(result).toBeNull();
      });

      it("should handle null specifiers in dependency", () => {
        const dependency = createDependencyDescription({
          dependency: createDependencyInfo({ specifiers: null }),
        });
        const dependencySelector: DependencyInfoSingleSelector[] = [
          { specifiers: "default" },
        ];
        const normalizedSelector: DependencySingleSelectorNormalized = {
          dependency: dependencySelector,
        };
        mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);
        micromatch.isMatch.mockReturnValue(false);

        const result = matcher.getSelectorMatching(dependency, {});

        expect(result).toBeNull();
      });

      it("should handle null nodeKind in dependency", () => {
        const dependency = createDependencyDescription({
          dependency: createDependencyInfo({ nodeKind: null }),
        });
        const dependencySelector: DependencyInfoSingleSelector[] = [
          { nodeKind: "ImportDeclaration" },
        ];
        const normalizedSelector: DependencySingleSelectorNormalized = {
          dependency: dependencySelector,
        };
        mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);
        micromatch.isMatch.mockReturnValue(false);

        const result = matcher.getSelectorMatching(dependency, {});

        expect(result).toBeNull();
      });

      it("should handle null relationship.from in dependency", () => {
        const dependency = createDependencyDescription({
          dependency: createDependencyInfo({
            relationship: { from: null, to: "parent" },
          }),
        });
        const dependencySelector: DependencyInfoSingleSelector[] = [
          { relationship: { from: "child" } },
        ];
        const normalizedSelector: DependencySingleSelectorNormalized = {
          dependency: dependencySelector,
        };
        mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);
        micromatch.isMatch.mockReturnValue(false);

        const result = matcher.getSelectorMatching(dependency, {});

        expect(result).toBeNull();
      });

      it("should handle null relationship.to in dependency", () => {
        const dependency = createDependencyDescription({
          dependency: createDependencyInfo({
            relationship: { from: "child", to: null },
          }),
        });
        const dependencySelector: DependencyInfoSingleSelector[] = [
          { relationship: { to: "parent" } },
        ];
        const normalizedSelector: DependencySingleSelectorNormalized = {
          dependency: dependencySelector,
        };
        mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);
        micromatch.isMatch.mockReturnValue(false);

        const result = matcher.getSelectorMatching(dependency, {});

        expect(result).toBeNull();
      });
    });
  });

  describe("isDependencyMatch", () => {
    it("should return true when a matching selector is found", () => {
      const dependency = createDependencyDescription();
      const normalizedSelector: DependencySingleSelectorNormalized = {};
      mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);

      const result = matcher.isDependencyMatch(dependency, {});

      expect(result).toBe(true);
    });

    it("should return false when no matching selector is found", () => {
      const dependency = createDependencyDescription();
      const fromSelector = [{ element: { type: "wrong" } }];
      const normalizedSelector: DependencySingleSelectorNormalized = {
        from: fromSelector as DependencySingleSelectorNormalized["from"],
      };
      mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);
      entitiesMatcher.getSelectorMatching.mockReturnValue(null);

      const result = matcher.isDependencyMatch(dependency, {});

      expect(result).toBe(false);
    });

    it("should return true when matching against array of selectors and one matches", () => {
      const dependency = createDependencyDescription();
      const firstSelector: DependencySingleSelectorNormalized = {
        from: [
          { element: { type: "wrong" } },
        ] as DependencySingleSelectorNormalized["from"],
      };
      const secondSelector: DependencySingleSelectorNormalized = {};
      mockedNormalizeDependencySelector.mockReturnValue([
        firstSelector,
        secondSelector,
      ]);
      entitiesMatcher.getSelectorMatching.mockReturnValue(null);

      const result = matcher.isDependencyMatch(dependency, {});

      expect(result).toBe(true);
    });

    it("should return false when matching against array of selectors and none matches", () => {
      const dependency = createDependencyDescription();
      const selectors: DependencySingleSelectorNormalized[] = [
        {
          from: [
            { element: { type: "wrong1" } },
          ] as DependencySingleSelectorNormalized["from"],
        },
        {
          from: [
            { element: { type: "wrong2" } },
          ] as DependencySingleSelectorNormalized["from"],
        },
      ];
      mockedNormalizeDependencySelector.mockReturnValue(selectors);
      entitiesMatcher.getSelectorMatching.mockReturnValue(null);

      const result = matcher.isDependencyMatch(dependency, {});

      expect(result).toBe(false);
    });

    it("should pass options through to getSelectorMatching", () => {
      const dependency = createDependencyDescription();
      const normalizedSelector: DependencySingleSelectorNormalized = {};
      mockedNormalizeDependencySelector.mockReturnValue([normalizedSelector]);

      const result = matcher.isDependencyMatch(
        dependency,
        {},
        {
          extraTemplateData: { custom: "data" },
        }
      );

      expect(result).toBe(true);
    });
  });
});
